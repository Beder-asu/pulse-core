const kafkaClient = require('./kafka-client');
const logger = require('./logger');

class KafkaConsumer {
  constructor(client = kafkaClient, serviceName = process.env.SERVICE_NAME) {
    this.client = client;
    this.serviceName = serviceName;
    this.consumer = null;
  }

  getConsumer() {
    if (!this.serviceName) {
      throw new Error('SERVICE_NAME is required before starting a Kafka consumer');
    }
    if (!this.consumer) {
      this.consumer = this.client.consumer({ groupId: `${this.serviceName}-group` });
    }
    return this.consumer;
  }

  async connect(topic, messageHandler) {
    const consumer = this.getConsumer();
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });
    logger.info(`Kafka consumer connected for topic: ${topic}`);

    await consumer.run({
      eachMessage: async ({ partition, message }) => {
        try {
          await messageHandler(JSON.parse(message.value.toString()));
        } catch (error) {
          // KafkaJS commits only after the handler resolves; logging here keeps
          // malformed legacy events from stopping the entire consumer loop.
          logger.error(`Error processing Kafka message from topic ${topic}`, {
            partition,
            error: error.message
          });
        }
      }
    });
  }

  async disconnect() {
    if (!this.consumer) return;
    await this.consumer.disconnect();
    this.consumer = null;
  }
}

module.exports = new KafkaConsumer();
module.exports.KafkaConsumer = KafkaConsumer;
