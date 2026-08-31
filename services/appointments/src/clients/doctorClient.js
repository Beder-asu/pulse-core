const { createProfileClient } = require('./profileClient');

module.exports = createProfileClient({
  getBaseUrl: () => process.env.DOCTORS_SERVICE_URL,
  resourcePath: '/api/doctors'
});
