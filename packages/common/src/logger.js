const winston = require('winston');

const LokiTransport = require('winston-loki');

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

if (process.env.ENABLE_LOKI_LOGGING === 'true') {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://loki:3100',
      labels: { app: process.env.SERVICE_NAME || 'unknown-service' },
      json: true,
      format: winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const suffix = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${message}${suffix}`;
      }),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error(err.message)
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports
});

module.exports = logger;
