const { logger } = require('@pulsecore/common');
const userRepository = require('../repositories/userRepository');
const passwordService = require('./passwordService');
const { createServiceError } = require('@pulsecore/common');

const createRegistrationService = ({ users, passwords, serviceLogger }) => ({
  register: async ({ email, password }) => {
    if (!email || !password) {
      throw createServiceError('Email and password are required', 400);
    }

    if (password.length < 8) {
      throw createServiceError('Password must be at least 8 characters', 400);
    }

    const existingUser = await users.findByEmail(email);
    if (existingUser) {
      throw createServiceError('User already exists', 400);
    }

    const hashedPassword = await passwords.hash(password);
    const user = await users.create({
      email,
      password: hashedPassword,
      // Public self-registration is intentionally unable to mint privileged
      // identities. Staff, doctors, and admins are provisioned administratively.
      role: 'PATIENT'
    });

    serviceLogger.info(`New user registered: ${user.id} as ${user.role}`);

    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
});

module.exports = createRegistrationService({
  users: userRepository,
  passwords: passwordService,
  serviceLogger: logger
});
module.exports.createRegistrationService = createRegistrationService;
