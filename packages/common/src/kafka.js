const publisher = require('./kafka-publisher');
const consumer = require('./kafka-consumer');

// Compatibility facade for older callers. New services import the narrow
// publisher or consumer adapter so their dependency states intent explicitly.
module.exports = {
  connectProducer: () => publisher.connect(),
  publish: (topic, message) => publisher.publish(topic, message),
  connectConsumer: (topic, handler) => consumer.connect(topic, handler),
  disconnect: () => Promise.all([publisher.disconnect(), consumer.disconnect()])
};
