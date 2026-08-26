const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');

class KafkaService {
  constructor() {
    const serviceName = process.env.SERVICE_NAME || 'unknown-service';

    // Connect to the Kafka broker on the Docker network
    this.kafka = new Kafka({
      clientId: serviceName,
      brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
      logLevel: logLevel.ERROR,
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: `${serviceName}-group` });
  }

  async connectProducer() {
    try {
      await this.producer.connect();
      logger.info('Kafka Producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka Producer', { error: error.message });
      throw error;
    }
  }

  async connectConsumer(topic, messageHandler) {
    try {
      await this.consumer.connect();
      logger.info(`Kafka Consumer connected for topic: ${topic}`);

      await this.consumer.subscribe({ topic, fromBeginning: true });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const eventPayload = JSON.parse(message.value.toString());
            await messageHandler(eventPayload);
          } catch (error) {
            logger.error(`Error processing Kafka message from topic ${topic}`, { error: error.message });
          }
        },
      });
    } catch (error) {
      logger.error('Failed to start Kafka Consumer', { error: error.message });
      throw error;
    }
  }

  async publish(topic, message) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      logger.info(`Published message to Kafka topic: ${topic}`);
    } catch (error) {
      logger.error(`Failed to publish to Kafka topic: ${topic}`, { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      logger.info('Kafka disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting Kafka', { error: error.message });
    }
  }
}

// Export a singleton instance
module.exports = new KafkaService();
