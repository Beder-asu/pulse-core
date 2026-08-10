const express = require('express');
const cors = require('cors');
const { logger, connectDB, errorHandler, notFound } = require('@pulsecore/common');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const pharmacyRoutes = require('./routes/pharmacyRoutes');
app.use('/api/pharmacy', pharmacyRoutes);

app.get('/api/pharmacy/health', (req, res) => {
  res.status(200).json({ status: 'Pharmacy Service OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3005;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/pulsecore_pharmacy')
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Pharmacy Service running on port ${PORT}`);
    });
  });
