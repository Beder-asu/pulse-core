const accessTokens = require('./tokenService');
const refreshTokens = require('./refreshTokenService');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const { createServiceError } = require('@pulsecore/common');

const invalidRefresh = () => createServiceError('Refresh token is invalid or expired', 401);

/**
 * Session orchestration is kept out of controllers and token primitives. It
 * owns credential issuance, one-time refresh rotation, replay response, and
 * revocation while depending only on narrow token/repository interfaces.
 */
const createSessionService = ({ access, refresh, storedTokens, now = () => new Date() }) => ({
  issue: async (user) => {
    const refreshToken = refresh.generate();
    const refreshExpiresAt = refresh.expiresAt(now());
    await storedTokens.create({ userId: user.id, tokenHash: refresh.hash(refreshToken), expiresAt: refreshExpiresAt });
    return { token: access.generate(user.id, user.role), refreshToken, refreshExpiresAt };
  },

  refresh: async (rawToken) => {
    if (!rawToken) throw invalidRefresh();
    const current = await storedTokens.findByHash(refresh.hash(rawToken));
    const currentTime = now();
    if (!current || current.expiresAt <= currentTime) throw invalidRefresh();

    // Reuse of a revoked token suggests theft. Revoke the entire user's active
    // token family so the legitimate browser must authenticate again.
    if (current.revokedAt) {
      await storedTokens.revokeAllForUser(current.userId, currentTime);
      throw invalidRefresh();
    }

    const nextToken = refresh.generate();
    const nextExpiresAt = refresh.expiresAt(currentTime);
    try {
      await storedTokens.rotate({
        currentId: current.id,
        userId: current.userId,
        tokenHash: refresh.hash(nextToken),
        expiresAt: nextExpiresAt,
        revokedAt: currentTime
      });
    } catch (error) {
      if (error.message === 'REFRESH_TOKEN_ALREADY_ROTATED') {
        await storedTokens.revokeAllForUser(current.userId, currentTime);
        throw invalidRefresh();
      }
      throw error;
    }

    return {
      id: current.user.id,
      email: current.user.email,
      role: current.user.role,
      token: access.generate(current.user.id, current.user.role),
      refreshToken: nextToken,
      refreshExpiresAt: nextExpiresAt
    };
  },

  revoke: async (rawToken) => {
    if (rawToken) await storedTokens.revokeByHash(refresh.hash(rawToken), now());
  },

  revokeAll: (userId) => storedTokens.revokeAllForUser(userId, now())
});

module.exports = createSessionService({ access: accessTokens, refresh: refreshTokens, storedTokens: refreshTokenRepository });
module.exports.createSessionService = createSessionService;
