const { kafkaConsumer, logger } = require('@pulsecore/common');
const appointmentCreatedHandler = require('../handlers/appointmentCreatedHandler');

const createHospitalEventsConsumer = ({ broker, handler, serviceLogger, getRetryMs }) => {
  const connectWithRetry = async () => {
    try {
      await broker.connect('hospital.events', handler);
    } catch (error) {
      const retryMs = getRetryMs();
      serviceLogger.warn(`Kafka consumer unavailable; retrying in ${retryMs}ms`, { error: error.message });
      const retryTimer = setTimeout(connectWithRetry, retryMs);
      retryTimer.unref();
    }
  };
  return { start: connectWithRetry };
};

module.exports = createHospitalEventsConsumer({
  broker: kafkaConsumer,
  handler: appointmentCreatedHandler,
  serviceLogger: logger,
  getRetryMs: () => Number(process.env.KAFKA_RETRY_MS || 5000)
});
module.exports.createHospitalEventsConsumer = createHospitalEventsConsumer;
