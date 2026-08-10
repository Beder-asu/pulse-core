const express = require('express');
const cors = require('cors');
const { logger, connectDB, errorHandler, notFound } = require('@pulsecore/common');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/notifications/health', (req, res) => {
  res.status(200).json({ status: 'Notification Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3007;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/pulsecore_notification')
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
    });
  });
