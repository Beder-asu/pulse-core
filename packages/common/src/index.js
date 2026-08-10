module.exports = {
  authMiddleware: require('./auth-middleware'),
  kafkaClient: require('./kafka-client'),
  redisClient: require('./redis-client'),
  mongooseClient: require('./mongoose-client'),
  logger: require('./logger'),
  errorHandler: require('./error-handler'),
  idempotency: require('./idempotency'),
  pagination: require('./pagination')
};
