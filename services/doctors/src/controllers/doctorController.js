const doctorProfileService = require('../services/doctorProfileService');

const forwardError = (error, res, next) => {
  if (error.statusCode) res.status(error.statusCode);
  next(error);
};

// @desc    Create doctor profile
// @route   POST /api/doctors/profile
// @access  Private (Admin/Staff/Self)
const createProfile = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.user.id;
    const profile = await doctorProfileService.createProfile({ ...req.body, requester: req.user, userId });
    res.status(201).json(profile);
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res, next) => {
  try {
    res.json(await doctorProfileService.getProfiles());
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get a doctor profile by profile id or user id
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res, next) => {
  try {
    res.json(await doctorProfileService.getProfileById(req.params.id));
  } catch (error) {
    forwardError(error, res, next);
  }
};

module.exports = {
  createProfile,
  getDoctors,
  getDoctorById
};
