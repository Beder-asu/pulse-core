const { kafkaPublisher, logger } = require('@pulsecore/common');

const connect = async () => {
  try {
    await kafkaPublisher.connect();
  } catch (error) {
    if (process.env.KAFKA_REQUIRED === 'true') throw error;
    logger.warn('Kafka producer unavailable; appointment events will be logged as failed until Kafka is restored', { error: error.message });
  }
};

module.exports = { connect };
