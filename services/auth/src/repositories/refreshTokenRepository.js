const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const create = (data) => prisma.refreshToken.create({ data });
const findByHash = (tokenHash) => prisma.refreshToken.findUnique({
  where: { tokenHash },
  include: { user: true }
});

/**
 * Rotation is atomic: either the old token is revoked and its replacement is
 * persisted together, or neither mutation is committed. updateMany provides
 * compare-and-set behavior so concurrent refresh requests cannot both win.
 */
const rotate = ({ currentId, userId, tokenHash, expiresAt, revokedAt }) => prisma.$transaction(async (tx) => {
  const replacement = await tx.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  const revoked = await tx.refreshToken.updateMany({
    where: { id: currentId, revokedAt: null, expiresAt: { gt: revokedAt } },
    data: { revokedAt, replacedByTokenId: replacement.id }
  });
  if (revoked.count !== 1) throw new Error('REFRESH_TOKEN_ALREADY_ROTATED');
  return replacement;
});

const revokeByHash = (tokenHash, revokedAt) => prisma.refreshToken.updateMany({
  where: { tokenHash, revokedAt: null },
  data: { revokedAt }
});
const revokeAllForUser = (userId, revokedAt) => prisma.refreshToken.updateMany({
  where: { userId, revokedAt: null },
  data: { revokedAt }
});

module.exports = { create, findByHash, rotate, revokeByHash, revokeAllForUser };
