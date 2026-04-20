const { KnexAdapter } = require('../lib/adapter-knex');

global.console = {
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

const DEFAULT_DATABASE_URL = 'postgres://postgres:open-keystone-demo-password@localhost:5432/main';

describe('Knex Adapter', () => {
  test('throws when database cannot be found using connection string', async () => {
    const testAdapter = new KnexAdapter({
      knexOptions: {
        connection:
          'postgres://postgres:open-keystone-demo-password@localhost:5432/undefined_database',
      },
    });
    const result = await testAdapter._connect().catch(result => result);
    expect(result.message).toMatch(/database "undefined_database" does not exist/);
  });

  test('throws when database connection fails with incorrect password', async () => {
    const testAdapter = new KnexAdapter({
      knexOptions: { connection: 'postgres://postgres:wrong_password@localhost:5432/postgres' },
    });
    const result = await testAdapter._connect().catch(result => result);
    expect(result.message).toMatch(/password authentication failed for user "postgres"/);
  });

  test('throws when database connection is refused on invalid port', async () => {
    const testAdapter = new KnexAdapter({
      knexOptions: { connection: 'postgres://localhost:6666/undefined_database' },
    });
    const result = await testAdapter._connect().catch(result => result);
    expect(result.message).toMatch(/ECONNREFUSED .*?:6666/);
  });

  test('throws when database cannot be found using connection object', async () => {
    const testAdapter = new KnexAdapter({
      knexOptions: {
        connection: {
          host: '127.0.0.1',
          user: 'your_database_user',
          password: 'your_database_password',
          database: 'undefined_database',
        },
      },
    });
    const result = await testAdapter._connect().catch(result => result);

    expect(result.message).toMatch(/password authentication failed for user "your_database_user"/);
  });

  describe('checkDatabaseVersion', () => {
    test('throws when database version is unsupported', async () => {
      const testAdapter = new KnexAdapter({
        knexOptions: { connection: DEFAULT_DATABASE_URL },
      });
      await testAdapter._connect();
      testAdapter.minVer = '50.5.5';
      const result = await testAdapter.checkDatabaseVersion().catch(result => result);
      expect(result).toBeInstanceOf(Error);
      testAdapter.disconnect();
    });

    test('does not throw when database version is supported', async () => {
      const testAdapter = new KnexAdapter({
        knexOptions: { connection: DEFAULT_DATABASE_URL },
      });
      await testAdapter._connect();
      testAdapter.minVer = '1.0.0';
      const result = await testAdapter.checkDatabaseVersion().catch(result => result);
      expect(result).not.toBeInstanceOf(Error);
      testAdapter.disconnect();
    });
  });
});
