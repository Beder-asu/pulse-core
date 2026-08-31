const { createProfileClient } = require('./profileClient');

module.exports = createProfileClient({
  getBaseUrl: () => process.env.PATIENTS_SERVICE_URL,
  resourcePath: '/api/patients'
});
