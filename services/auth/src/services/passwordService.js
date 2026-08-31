const bcrypt = require('bcryptjs');

const hash = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const compare = (password, passwordHash) => bcrypt.compare(password, passwordHash);

module.exports = { hash, compare };
