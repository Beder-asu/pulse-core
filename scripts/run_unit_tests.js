const { existsSync, readdirSync } = require('node:fs');
const { join, relative } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = join(__dirname, '..');
const prismaCli = require.resolve('prisma/build/index.js');

const findTests = (directory) => {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findTests(path);
    return entry.isFile() && entry.name.endsWith('.test.js') ? [path] : [];
  });
};

const run = (label, command, args) => {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

const sharedTests = [
  ...findTests(join(root, 'packages')),
  join(root, 'scripts', 'access_policy_test.js'),
];
if (sharedTests.length) {
  run('Shared package tests', process.execPath, ['--test', ...sharedTests]);
}

const servicesRoot = join(root, 'services');
const services = readdirSync(servicesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const service of services) {
  const serviceRoot = join(servicesRoot, service);
  const tests = findTests(serviceRoot);
  if (!tests.length) continue;

  const schema = join(serviceRoot, 'prisma', 'schema.prisma');
  run(`${service}: generate Prisma client`, process.execPath, [prismaCli, 'generate', '--schema', schema]);
  run(
    `${service}: ${tests.length} test file${tests.length === 1 ? '' : 's'}`,
    process.execPath,
    ['--test', ...tests]
  );
}

const total = sharedTests.length + services.reduce(
  (sum, service) => sum + findTests(join(servicesRoot, service)).length,
  0
);
console.log(`\nVerified ${total} backend/shared test files.`);
