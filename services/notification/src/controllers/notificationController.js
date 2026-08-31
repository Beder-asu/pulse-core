const notificationService = require('../services/notificationService');

const forwardError = (error, res, next) => {
  if (error.statusCode) res.status(error.statusCode);
  next(error);
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    res.json(await notificationService.getNotifications(req.user));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    res.json(await notificationService.markAsRead({ id: req.params.id, requester: req.user }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

module.exports = { getNotifications, markAsRead };
