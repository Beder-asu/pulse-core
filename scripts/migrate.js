const { execSync } = require('child_process');
const path = require('path');

const services = ['auth', 'patients', 'doctors', 'appointments', 'lab', 'pharmacy', 'billing', 'notification'];
const host = process.env.POSTGRES_HOST || '127.0.0.1';
const port = process.env.POSTGRES_PORT || '5434';
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || 'replace-with-local-demo-password';

services.forEach(service => {
  console.log(`Migrating ${service}...`);
  try {
    execSync('npx prisma migrate dev --name init', {
      cwd: path.join(__dirname, '..', 'services', service),
      env: {
        ...process.env,
        POSTGRES_BASE_URL: `postgresql://${user}:${password}@${host}:${port}/${service}_db`
      },
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(`Migration failed for ${service}`);
  }
});
console.log('All migrations completed.');
