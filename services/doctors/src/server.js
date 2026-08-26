const express = require('express');
const cors = require('cors');
const { logger, errorHandler, notFound, metricsMiddleware } = require('@pulsecore/common');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
const doctorRoutes = require('./routes/doctorRoutes');
app.use('/api/doctors', doctorRoutes);

app.get('/api/doctors/health', (req, res) => {
  res.status(200).json({ status: 'Doctors Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
      logger.info(`Doctors Service running on port ${PORT}`);
    });
