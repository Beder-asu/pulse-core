const express = require('express');
const cors = require('cors');
const { logger, errorHandler, notFound, metricsMiddleware } = require('@pulsecore/common');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
const labRoutes = require('./routes/labRoutes');
app.use('/api/lab', labRoutes);

app.get('/api/lab/health', (req, res) => {
  res.status(200).json({ status: 'Lab Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
      logger.info(`Lab Service running on port ${PORT}`);
    });
