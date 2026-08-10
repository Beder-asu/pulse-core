const express = require('express');
const cors = require('cors');
const { logger, connectDB, errorHandler, notFound } = require('@pulsecore/common');

// Load env vars (in production this comes from docker-compose)
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/api/patients/health', (req, res) => {
  res.status(200).json({ status: 'Patients Service OK' });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Connect to DB then start server
connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/pulsecore_patients')
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Patients Service running on port ${PORT}`);
    });
  });
