const express = require('express');
const cors = require('cors');
const { logger, errorHandler, notFound, metricsMiddleware } = require('@pulsecore/common');
const hospitalEventsConsumer = require('./messaging/consumers/hospitalEventsConsumer');
const legacyRepairScheduler = require('./maintenance/legacyRepairScheduler');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

app.get('/api/notifications/health', (req, res) => {
  res.status(200).json({ status: 'Notification Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3007;
const startServer = () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
      hospitalEventsConsumer.start();
      legacyRepairScheduler.schedule();
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
