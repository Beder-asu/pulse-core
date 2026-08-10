const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri);
    logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
