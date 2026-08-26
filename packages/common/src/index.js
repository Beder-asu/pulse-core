const logger = require('./logger');
const { protect, authorize } = require('./auth-middleware');
const { errorHandler, notFound } = require('./error-handler');
const { metricsMiddleware } = require('./metrics');
const kafka = require('./kafka');

module.exports = {
  logger,
  protect,
  authorize,
  errorHandler,
  notFound,
  metricsMiddleware,
  kafka
};
