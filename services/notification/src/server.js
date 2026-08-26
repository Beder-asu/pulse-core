const express = require('express');
const cors = require('cors');
const { logger, errorHandler, notFound, metricsMiddleware, kafka } = require('@pulsecore/common');
const { createAppointmentNotification } = require('./controllers/notificationController');

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

const startServer = async () => {
  try {
    try {
      await kafka.connectConsumer('hospital.events', async (eventPayload) => {
        if (eventPayload.event === 'AppointmentCreated') {
          const { appointmentId, patientId, doctorId, date, timeSlot } = eventPayload.payload;
          logger.info(`Received AppointmentCreated event via Kafka for appointment ${appointmentId}`);
          await createAppointmentNotification({
            eventId: eventPayload.eventId || appointmentId,
            patientId,
            doctorId,
            date,
            timeSlot
          });
        }
      });
    } catch (error) {
      if (process.env.KAFKA_REQUIRED === 'true') {
        throw error;
      }
      logger.warn('Kafka consumer unavailable; notification API will start without event consumption', { error: error.message });
    }

    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
