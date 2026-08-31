const { logger } = require('@pulsecore/common');
const userRepository = require('../repositories/userRepository');
const passwordService = require('./passwordService');
const sessionService = require('./sessionService');
const { createServiceError } = require('@pulsecore/common');

const createAuthenticationService = ({ users, passwords, sessions, serviceLogger }) => ({
  login: async ({ email, password }) => {
    if (!email || !password) {
      throw createServiceError('Email and password are required', 400);
    }

    const user = await users.findByEmail(email);
    if (!user || !(await passwords.compare(password, user.password))) {
      throw createServiceError('Invalid email or password', 401);
    }

    serviceLogger.info(`User logged in: ${user.id}`);

    const session = await sessions.issue(user);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      ...session
    };
  }
});

module.exports = createAuthenticationService({
  users: userRepository,
  passwords: passwordService,
  sessions: sessionService,
  serviceLogger: logger
});
module.exports.createAuthenticationService = createAuthenticationService;
