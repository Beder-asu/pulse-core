const { logger } = require('@pulsecore/common');
const doctorRepository = require('../repositories/doctorRepository');
const { createServiceError } = require('../errors/serviceError');
const doctorAccessPolicy = require('../policies/doctorAccessPolicy');
const doctorProfileCache = require('../cache/doctorProfileCache');

const disabledCache = {
  getList: async () => undefined,
  setList: async () => false,
  getByIdentifier: async () => undefined,
  setProfile: async () => false,
  storeCreatedProfile: async () => false
};

const createDoctorProfileService = ({ doctors, access, serviceLogger, profileCache = disabledCache }) => ({
  createProfile: async ({ requester, userId, firstName, lastName, departmentId, specializationId, contactNumber }) => {
    access.assertCanCreate(requester, userId);
    if (!firstName || !lastName || !departmentId || !specializationId) {
      throw createServiceError('First name, last name, department, and specialization are required', 400);
    }

    if (await doctors.findByUserId(userId)) {
      throw createServiceError('Profile already exists', 400);
    }

    const profile = await doctors.create({
      userId,
      firstName,
      lastName,
      departmentId,
      specializationId,
      contactNumber
    });
    serviceLogger.info(`Doctor profile created for user: ${userId}`);
    await profileCache.storeCreatedProfile(profile);
    return profile;
  },

  getProfiles: async () => {
    const cachedProfiles = await profileCache.getList();
    if (cachedProfiles !== undefined) return cachedProfiles;

    const profiles = await doctors.findAll();
    await profileCache.setList(profiles);
    await Promise.all(profiles.map((profile) => profileCache.setProfile(profile)));
    return profiles;
  },

  getProfileById: async (id) => {
    const cachedProfile = await profileCache.getByIdentifier(id);
    if (cachedProfile !== undefined) return cachedProfile;

    const profile = await doctors.findByIdOrUserId(id);
    if (!profile) throw createServiceError('Doctor profile not found', 404);
    await profileCache.setProfile(profile);
    return profile;
  }
});

module.exports = createDoctorProfileService({
  doctors: doctorRepository,
  access: doctorAccessPolicy,
  serviceLogger: logger,
  profileCache: doctorProfileCache
});
module.exports.createDoctorProfileService = createDoctorProfileService;
