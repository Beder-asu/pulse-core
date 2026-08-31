const registrationService = require('../services/registrationService');
const authenticationService = require('../services/authenticationService');
const sessionService = require('../services/sessionService');
const refreshCookie = require('../http/refreshCookie');

const forwardError = (error, res, next) => {
  if (error.statusCode) res.status(error.statusCode);
  next(error);
};

const register = async (req, res, next) => {
  try {
    const result = await registrationService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    forwardError(error, res, next);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authenticationService.login(req.body);
    refreshCookie.write(res, result.refreshToken, result.refreshExpiresAt);
    const { refreshToken, refreshExpiresAt, ...response } = result;
    res.json(response);
  } catch (error) {
    forwardError(error, res, next);
  }
};

const refresh = async (req, res, next) => {
  try {
    const result = await sessionService.refresh(refreshCookie.read(req));
    refreshCookie.write(res, result.refreshToken, result.refreshExpiresAt);
    const { refreshToken, refreshExpiresAt, ...response } = result;
    res.json(response);
  } catch (error) {
    refreshCookie.clear(res);
    forwardError(error, res, next);
  }
};

const logout = async (req, res, next) => {
  try {
    await sessionService.revoke(refreshCookie.read(req));
    refreshCookie.clear(res);
    res.status(204).send();
  } catch (error) {
    forwardError(error, res, next);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await sessionService.revokeAll(req.user.id);
    refreshCookie.clear(res);
    res.status(204).send();
  } catch (error) {
    forwardError(error, res, next);
  }
};

module.exports = { register, login, refresh, logout, logoutAll };
