const { execSync } = require('child_process');
const path = require('path');

const services = ['auth', 'patients', 'doctors', 'appointments', 'lab', 'pharmacy', 'billing', 'notification'];
const host = process.env.POSTGRES_HOST || '127.0.0.1';
const port = process.env.POSTGRES_PORT || '5434';
const user = process.env.POSTGRES_USER || 'postgres';
const requireEnv = (name) => {
  if (!process.env[name]) {
    throw new Error(`${name} must be set before running database seeds`);
  }
  return process.env[name];
};
const password = requireEnv('POSTGRES_PASSWORD');

for (const service of services) {
  console.log(`\nSeeding ${service}...`);
  try {
    const cwd = path.join(__dirname, '..', 'services', service);
    const env = {
      ...process.env,
      POSTGRES_BASE_URL: `postgresql://${user}:${password}@${host}:${port}/${service}_db`
    };

    execSync('npx prisma generate', {
      cwd,
      env,
      stdio: 'inherit',
    });

    execSync('npx prisma db seed', {
      cwd,
      env,
      stdio: 'inherit',
    });
    console.log(`SUCCESS: ${service}`);
  } catch (error) {
    console.error(`FAILED: ${service}`);
    process.exitCode = 1;
  }
}
