const test = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler } = require('./error-handler');

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test('unexpected errors do not expose implementation details', () => {
  const response = createResponse();
  errorHandler(
    new Error('Unknown Prisma argument user; available fields are secret'),
    { originalUrl: '/api/test', method: 'GET', ip: '127.0.0.1' },
    response,
    () => {}
  );
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { message: 'Internal server error' });
});

test('explicit client errors preserve their useful message', () => {
  const response = createResponse();
  const error = Object.assign(new Error('patientId must be a UUIDv7 string'), { statusCode: 400 });
  errorHandler(error, { originalUrl: '/api/test', method: 'GET', ip: '127.0.0.1' }, response, () => {});
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { message: 'patientId must be a UUIDv7 string' });
});
