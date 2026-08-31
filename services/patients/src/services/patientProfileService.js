const { logger } = require('@pulsecore/common');
const patientRepository = require('../repositories/patientRepository');
const { createServiceError } = require('../errors/serviceError');
const patientAccessPolicy = require('../policies/patientAccessPolicy');

const createPatientProfileService = ({ patients, access, serviceLogger }) => ({
  createProfile: async ({ requester, userId, firstName, lastName, dateOfBirth, contactNumber, address, bloodGroup }) => {
    access.assertCanCreate(requester, userId);
    if (!firstName || !lastName) {
      throw createServiceError('First name and last name are required', 400);
    }

    if (await patients.findByUserId(userId)) {
      throw createServiceError('Profile already exists', 400);
    }

    const profile = await patients.create({
      userId,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      contactNumber,
      address,
      bloodGroup
    });

    serviceLogger.info(`Patient profile created for user: ${userId}`);
    return profile;
  },

  getCurrentProfile: async (requester) => {
    const userId = requester.id;
    const profile = await patients.findByUserId(userId);
    if (!profile) throw createServiceError('Patient profile not found', 404);
    return profile;
  },

  getProfiles: (requester) => patients.findAll(access.readScope(requester)),

  getProfileById: async ({ requester, id }) => {
    const profile = await patients.findByIdOrUserId(id);
    if (!profile) throw createServiceError('Patient profile not found', 404);
    access.assertCanReadProfile(requester, profile);
    return profile;
  }
});

module.exports = createPatientProfileService({ patients: patientRepository, access: patientAccessPolicy, serviceLogger: logger });
module.exports.createPatientProfileService = createPatientProfileService;
