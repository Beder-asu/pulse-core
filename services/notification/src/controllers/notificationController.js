const Notification = require('../models/Notification');
const { logger } = require('@pulsecore/common');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    const updated = await notification.save();
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
