const COOKIE_NAME = 'pulsecore_refresh';

const cookieOptions = (expires) => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  path: '/api/auth',
  ...(expires ? { expires } : {})
});

const read = (req) => {
  const cookies = (req.headers.cookie || '').split(';');
  const entry = cookies.map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)) : null;
};

const write = (res, token, expires) => res.cookie(COOKIE_NAME, token, cookieOptions(expires));
const clear = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

module.exports = { read, write, clear };
