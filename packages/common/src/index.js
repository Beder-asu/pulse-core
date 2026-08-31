const logger = require('./logger');
const { protect, authorize } = require('./auth-middleware');
const { errorHandler, notFound } = require('./error-handler');
const { metricsMiddleware } = require('./metrics');
const { uuidv7, isUuidV7, requireOptionalUuidV7 } = require('./uuid');

const common = {
  logger,
  protect,
  authorize,
  errorHandler,
  notFound,
  metricsMiddleware,
  uuidv7,
  isUuidV7,
  requireOptionalUuidV7
};

// Lazy getters keep non-messaging services from constructing Kafka adapters
// simply because they import the shared package for logging or middleware.
Object.defineProperties(common, {
  kafka: { enumerable: true, get: () => require('./kafka') },
  kafkaPublisher: { enumerable: true, get: () => require('./kafka-publisher') },
  kafkaConsumer: { enumerable: true, get: () => require('./kafka-consumer') },
  redisCache: { enumerable: true, get: () => require('./redis-client') }
});

module.exports = common;
