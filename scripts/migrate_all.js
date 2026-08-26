const { execSync } = require('child_process');
const path = require('path');

const services = ['auth', 'patients', 'doctors', 'appointments', 'lab', 'pharmacy', 'billing', 'notification'];
const host = process.env.POSTGRES_HOST || '127.0.0.1';
const port = process.env.POSTGRES_PORT || '5434';
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || 'replace-with-local-demo-password';

services.forEach(service => {
  console.log(`\n\n========================================`);
  console.log(`Migrating ${service}...`);
  console.log(`========================================\n`);
  try {
    execSync('npx prisma db push --accept-data-loss', {
      cwd: path.join(__dirname, '..', 'services', service),
      env: {
        ...process.env,
        POSTGRES_BASE_URL: `postgresql://${user}:${password}@${host}:${port}/${service}_db`
      },
      stdio: 'inherit'
    });
    console.log(`SUCCESS: ${service}`);
  } catch (error) {
    console.error(`FAILED: ${service}`);
  }
});
console.log('\nAll migrations completed.');
