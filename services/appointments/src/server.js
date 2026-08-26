const express = require('express');
const cors = require('cors');
const { logger, errorHandler, notFound, metricsMiddleware, kafka } = require('@pulsecore/common');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

app.get('/api/appointments/health', (req, res) => {
  res.status(200).json({ status: 'Appointments Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    try {
      await kafka.connectProducer();
    } catch (error) {
      if (process.env.KAFKA_REQUIRED === 'true') {
        throw error;
      }
      logger.warn('Kafka producer unavailable; appointment events will be logged as failed until Kafka is restored', { error: error.message });
    }

    app.listen(PORT, () => {
      logger.info(`Appointments Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
