const kafkaClient = require('./kafka-client');
const logger = require('./logger');

class KafkaPublisher {
  constructor(client = kafkaClient) {
    this.producer = client.producer();
    this.connected = false;
    this.connection = null;
  }

  async connect() {
    if (this.connected) return;
    if (this.connection) return this.connection;

    // Sharing the in-flight promise prevents concurrent HTTP requests from
    // opening duplicate broker connections during startup or recovery.
    this.connection = this.producer.connect();
    try {
      await this.connection;
      this.connected = true;
      logger.info('Kafka producer connected successfully');
    } finally {
      this.connection = null;
    }
  }

  async publish(topic, message) {
    await this.connect();
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    logger.info(`Published message to Kafka topic: ${topic}`);
  }

  async disconnect() {
    if (!this.connected) return;
    await this.producer.disconnect();
    this.connected = false;
  }
}

module.exports = new KafkaPublisher();
module.exports.KafkaPublisher = KafkaPublisher;
