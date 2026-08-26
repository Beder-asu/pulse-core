const express = require('express');
const cors = require('cors');
const { logger, errorHandler, notFound, metricsMiddleware } = require('@pulsecore/common');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
const billingRoutes = require('./routes/billingRoutes');
app.use('/api/billing', billingRoutes);

app.get('/api/billing/health', (req, res) => {
  res.status(200).json({ status: 'Billing Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  logger.info(`Billing Service running on port ${PORT}`);
});
