const express = require('express');
const cors = require('cors');
const { logger, connectDB, errorHandler, notFound } = require('@pulsecore/common');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const labRoutes = require('./routes/labRoutes');
app.use('/api/lab', labRoutes);

app.get('/api/lab/health', (req, res) => {
  res.status(200).json({ status: 'Lab Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3004;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/pulsecore_lab')
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Lab Service running on port ${PORT}`);
    });
  });
