const patientProfileService = require('../services/patientProfileService');

const forwardError = (error, res, next) => {
  if (error.statusCode) res.status(error.statusCode);
  next(error);
};

// @desc    Create patient profile (Usually called via Kafka after Auth Registration)
// @route   POST /api/patients/profile
// @access  Private
const createProfile = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.user.id;
    const profile = await patientProfileService.createProfile({ ...req.body, requester: req.user, userId });
    res.status(201).json(profile);
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private
const getPatientProfile = async (req, res, next) => {
  try {
    res.json(await patientProfileService.getCurrentProfile(req.user));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get all patient profiles
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res, next) => {
  try {
    res.json(await patientProfileService.getProfiles(req.user));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get patient profile by profile id or user id
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res, next) => {
  try {
    res.json(await patientProfileService.getProfileById({ requester: req.user, id: req.params.id }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

module.exports = {
  createProfile,
  getPatientProfile,
  getPatients,
  getPatientById
};
