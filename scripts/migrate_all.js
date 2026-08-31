const { execFileSync } = require('child_process');
const path = require('path');

const services = ['auth', 'patients', 'doctors', 'appointments', 'lab', 'pharmacy', 'billing', 'notification'];
const host = process.env.POSTGRES_HOST || '127.0.0.1';
const port = process.env.POSTGRES_PORT || '5434';
const user = process.env.POSTGRES_USER || 'postgres';
const requireEnv = (name) => {
  if (!process.env[name]) {
    throw new Error(`${name} must be set before running database migrations`);
  }
  return process.env[name];
};
const password = requireEnv('POSTGRES_PASSWORD');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const uuidSqlPath = path.join(__dirname, 'uuidv7.sql');

for (const service of services) {
  console.log(`\n\n========================================`);
  console.log(`Migrating ${service}...`);
  console.log(`========================================\n`);
  const cwd = path.join(__dirname, '..', 'services', service);
  const env = {
    ...process.env,
    POSTGRES_BASE_URL: `postgresql://${user}:${password}@${host}:${port}/${service}_db`
  };

  try {
    execFileSync(npx, ['prisma', 'db', 'execute', '--file', uuidSqlPath, '--schema', 'prisma/schema.prisma'], {
      cwd,
      env,
      stdio: 'inherit'
    });
    execFileSync(npx, ['prisma', 'db', 'push', '--accept-data-loss'], {
      cwd,
      env,
      stdio: 'inherit'
    });
    console.log(`SUCCESS: ${service}`);
  } catch (error) {
    console.error(`FAILED: ${service}`);
    process.exit(1);
  }
}
console.log('\nAll migrations completed.');
