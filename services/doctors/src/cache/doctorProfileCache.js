const { redisCache } = require('@pulsecore/common');

const parseTtl = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const LIST_KEY = 'doctors:profiles:v1:all';
const profileKey = (identifier) => `doctors:profiles:v1:${identifier}`;

/**
 * Doctor-specific cache policy.
 *
 * Keeping these rules in the owning service prevents the shared Redis adapter
 * from learning domain details. PostgreSQL remains authoritative; every read
 * is cache-aside, and profile creation invalidates the list before warming the
 * two supported lookup aliases (profile ID and Auth user ID).
 */
const createDoctorProfileCache = ({
  cache = redisCache,
  listTtlSeconds = parseTtl(process.env.DOCTOR_LIST_CACHE_TTL_SECONDS, 300),
  profileTtlSeconds = parseTtl(process.env.DOCTOR_PROFILE_CACHE_TTL_SECONDS, 300)
} = {}) => ({
  getList: () => cache.getJson(LIST_KEY),

  setList: (profiles) => cache.setJson(LIST_KEY, profiles, listTtlSeconds),

  getByIdentifier: (identifier) => cache.getJson(profileKey(identifier)),

  setProfile: async (profile) => {
    const identifiers = new Set([profile.id, profile.userId].filter(Boolean));
    await Promise.all([...identifiers].map((identifier) => (
      cache.setJson(profileKey(identifier), profile, profileTtlSeconds)
    )));
  },

  storeCreatedProfile: async (profile) => {
    await cache.delete(LIST_KEY);
    await Promise.all([
      cache.setJson(profileKey(profile.id), profile, profileTtlSeconds),
      cache.setJson(profileKey(profile.userId), profile, profileTtlSeconds)
    ]);
  },

  status: () => cache.status()
});

module.exports = createDoctorProfileCache();
module.exports.createDoctorProfileCache = createDoctorProfileCache;
module.exports.LIST_KEY = LIST_KEY;
module.exports.profileKey = profileKey;
