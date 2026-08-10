const express = require('express');
const cors = require('cors');
const { logger, connectDB, errorHandler, notFound } = require('@pulsecore/common');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/billing/health', (req, res) => {
  res.status(200).json({ status: 'Billing Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3006;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/pulsecore_billing')
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Billing Service running on port ${PORT}`);
    });
  });
