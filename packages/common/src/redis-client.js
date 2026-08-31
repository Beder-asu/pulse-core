const { createClient } = require('redis');
const { Counter, register } = require('prom-client');
const logger = require('./logger');

const METRIC_NAME = 'pulsecore_cache_operations_total';
const cacheOperations = register.getSingleMetric(METRIC_NAME) || new Counter({
  name: METRIC_NAME,
  help: 'Number of cache operations grouped by cache, operation, and result',
  labelNames: ['service', 'cache', 'operation', 'result']
});

const positiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Small Redis transport for JSON cache values.
 *
 * Domain services remain responsible for choosing keys, TTLs, and invalidation
 * rules. This adapter only manages a lazy Redis connection, serialization, and
 * fail-open behavior. A Redis outage therefore degrades cache performance but
 * does not replace or block the service's PostgreSQL source of truth.
 */
class RedisJsonCache {
  constructor({
    url = process.env.REDIS_URL,
    cacheName = process.env.SERVICE_NAME || 'unknown-service',
    serviceName = process.env.SERVICE_NAME || 'unknown-service',
    connectTimeoutMs = positiveInteger(process.env.REDIS_CONNECT_TIMEOUT_MS, 1000),
    retryCooldownMs = positiveInteger(process.env.REDIS_RETRY_COOLDOWN_MS, 5000),
    clientFactory = createClient,
    serviceLogger = logger,
    now = Date.now
  } = {}) {
    this.url = url;
    this.cacheName = cacheName;
    this.serviceName = serviceName;
    this.connectTimeoutMs = connectTimeoutMs;
    this.retryCooldownMs = retryCooldownMs;
    this.clientFactory = clientFactory;
    this.logger = serviceLogger;
    this.now = now;
    this.client = null;
    this.connection = null;
    this.retryAfter = 0;
    this.state = url ? 'idle' : 'disabled';
  }

  isEnabled() {
    return Boolean(this.url);
  }

  status() {
    return this.state;
  }

  record(operation, result) {
    cacheOperations.inc({
      service: this.serviceName,
      cache: this.cacheName,
      operation,
      result
    });
  }

  async connect() {
    if (!this.isEnabled()) return null;
    if (this.client?.isReady) return this.client;
    if (this.connection) return this.connection;
    if (this.now() < this.retryAfter) return null;

    const client = this.clientFactory({
      url: this.url,
      socket: {
        connectTimeout: this.connectTimeoutMs,
        reconnectStrategy: false
      }
    });

    // node-redis requires an error listener. Operation failures are logged by
    // run(), where the cache key and attempted operation are also available.
    client.on('error', () => {
      this.state = 'degraded';
    });
    this.client = client;
    this.state = 'connecting';

    this.connection = client.connect().then(() => {
      this.state = 'ready';
      return client;
    }).finally(() => {
      this.connection = null;
    });

    return this.connection;
  }

  async markUnavailable(operation, key, error) {
    this.state = 'degraded';
    this.retryAfter = this.now() + this.retryCooldownMs;
    this.record(operation, 'error');
    this.logger.warn('Redis cache operation failed; using the database path', {
      cache: this.cacheName,
      operation,
      key,
      error: error.message
    });

    const failedClient = this.client;
    this.client = null;
    if (failedClient?.isOpen) {
      try {
        await failedClient.disconnect();
      } catch (_) {
        // The connection is already unusable; cleanup must not hide fallback.
      }
    }
  }

  async run(operation, key, callback, fallback) {
    if (!this.isEnabled()) {
      this.record(operation, 'disabled');
      return fallback;
    }

    try {
      const client = await this.connect();
      if (!client) {
        this.record(operation, 'cooldown');
        return fallback;
      }
      return await callback(client);
    } catch (error) {
      await this.markUnavailable(operation, key, error);
      return fallback;
    }
  }

  async getJson(key) {
    return this.run('get', key, async (client) => {
      const value = await client.get(key);
      if (value === null) {
        this.record('get', 'miss');
        return undefined;
      }

      try {
        const parsed = JSON.parse(value);
        this.record('get', 'hit');
        return parsed;
      } catch (error) {
        this.record('get', 'invalid');
        await client.del(key);
        this.logger.warn('Removed an invalid JSON value from the Redis cache', {
          cache: this.cacheName,
          key,
          error: error.message
        });
        return undefined;
      }
    }, undefined);
  }

  async setJson(key, value, ttlSeconds) {
    return this.run('set', key, async (client) => {
      await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
      this.record('set', 'success');
      return true;
    }, false);
  }

  async delete(...keys) {
    if (keys.length === 0) return 0;
    return this.run('delete', keys.join(','), async (client) => {
      const deleted = await client.del(keys);
      this.record('delete', 'success');
      return deleted;
    }, 0);
  }

  async close() {
    const client = this.client;
    this.client = null;
    this.state = this.isEnabled() ? 'closed' : 'disabled';
    if (client?.isOpen) await client.quit();
  }
}

module.exports = new RedisJsonCache();
module.exports.RedisJsonCache = RedisJsonCache;
