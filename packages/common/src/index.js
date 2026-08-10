const logger = require('./logger');
const connectDB = require('./db');
const { protect, authorize } = require('./auth-middleware');
const { errorHandler, notFound } = require('./error-handler');

module.exports = {
  logger,
  connectDB,
  protect,
  authorize,
  errorHandler,
  notFound
};
