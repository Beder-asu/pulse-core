const crypto = require('crypto');

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const uuidv7 = (timestamp = Date.now()) => {
  const bytes = crypto.randomBytes(16);
  const milliseconds = BigInt(timestamp);

  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number((milliseconds >> BigInt((5 - index) * 8)) & 0xffn);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const isUuidV7 = (value) => UUID_V7_PATTERN.test(value || '');

const requireOptionalUuidV7 = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !isUuidV7(value)) {
    const error = new Error(`${fieldName} must be a UUIDv7 string`);
    error.statusCode = 400;
    throw error;
  }
  return value;
};

module.exports = { uuidv7, isUuidV7, requireOptionalUuidV7 };
