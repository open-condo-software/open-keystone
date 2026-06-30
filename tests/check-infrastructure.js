const net = require('net');

const CHECK_TIMEOUT = 1000;

async function checkPort(port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };

    socket.setTimeout(CHECK_TIMEOUT);
    socket.once('error', onError);
    socket.once('timeout', onError);

    socket.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
  });
}

async function checkInfrastructure() {
  const adapter = process.env.TEST_ADAPTER;

  const checks = [
    { name: 'PostgreSQL', port: 5432, adapters: ['knex', 'prisma_postgresql'] },
    { name: 'MongoDB', port: 27017, adapters: ['mongoose'] },
  ];

  const failedChecks = [];

  for (const check of checks) {
    // If TEST_ADAPTER is set, only check relevant DB. Otherwise check all.
    if (!adapter || check.adapters.includes(adapter)) {
      const isUp = await checkPort(check.port);
      if (!isUp) {
        failedChecks.push(check);
      }
    }
  }

  if (failedChecks.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '\nERROR: Required infrastructure is not running!');
    failedChecks.forEach(check => {
      console.error('\x1b[33m%s\x1b[0m', `  - ${check.name} (port ${check.port}) is unreachable.`);
    });
    console.error('\nTo start the infrastructure, run:');
    console.error('\x1b[32m%s\x1b[0m', '  docker compose up -d\n');

    // In CI we might want to fail, but locally it's a strong recommendation
    if (process.env.CI) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  checkInfrastructure();
}

module.exports = { checkInfrastructure };
