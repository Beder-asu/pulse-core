const { logger } = require('@pulsecore/common');
const legacyNotificationRepairService = require('../services/legacyNotificationRepairService');

const schedule = () => {
  setTimeout(async () => {
    try {
      const repairedCount = await legacyNotificationRepairService.repair();
      if (repairedCount > 0) logger.info(`Repaired ${repairedCount} legacy appointment notification message(s)`);
    } catch (error) {
      logger.warn('Unable to repair legacy appointment notification messages', { error: error.message });
    }
  }, 5000).unref();
};

module.exports = { schedule };
