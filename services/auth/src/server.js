const express = require('express');
const cors = require('cors');
const { errorHandler, logger, metricsMiddleware } = require('@pulsecore/common');
const authRoutes = require('./routes/authRoutes');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/api/auth', authRoutes);

app.get('/api/auth/health', (req, res) => {
  res.status(200).json({ status: 'Auth Service OK' });
});

app.use(errorHandler);

const PORT = process.env.SERVICE_PORT || 3008;

app.listen(PORT, () => {
  logger.info(`Auth Service running on port ${PORT}`);
});
