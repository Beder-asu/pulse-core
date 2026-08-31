const { Kafka, logLevel } = require('kafkajs');

// The client is transport configuration only. Producer and consumer lifecycles
// live in separate adapters so importing a publisher never creates a consumer.
module.exports = new Kafka({
  clientId: process.env.SERVICE_NAME || 'pulsecore-tooling',
  brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
  logLevel: logLevel.ERROR
});
