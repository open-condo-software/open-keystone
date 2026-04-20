import path from 'path';
import crypto from 'crypto';
import { ServerResponse } from 'http';
import express from 'express';
import type { Express } from 'express';
import { knex } from 'knex';
// @ts-ignore
import supertest from 'supertest-light';
// @ts-ignore
import { Keystone } from '@open-keystone/keystone';
// @ts-ignore
import { GraphQLApp } from '@open-keystone/app-graphql';
// @ts-ignore
import { KnexAdapter } from '@open-keystone/adapter-knex';
// @ts-ignore
import { MongooseAdapter } from '@open-keystone/adapter-mongoose';
// @ts-ignore
import { PrismaAdapter } from '@open-keystone/adapter-prisma';

export type AdapterName = 'mongoose' | 'knex' | 'prisma_postgresql';

export interface MongooseAdapterArgs {
  mongoUri: string;
  dropDatabase: boolean;
}

export interface KnexAdapterArgs {
  dropDatabase: boolean;
  schemaName: string;
  knexOptions: {
    connection: string;
  };
}

export interface PrismaAdapterArgs {
  migrationMode: 'prototype' | 'dev' | 'none';
  dropDatabase: boolean;
  url: string;
  provider: 'postgresql';
  getPrismaPath: (args: { prismaSchema: string }) => string;
  getDbSchemaName: () => string;
  enableLogging: boolean;
}

type AdapterArgs = MongooseAdapterArgs | KnexAdapterArgs | PrismaAdapterArgs;

const ENABLE_SCHEMA_PER_TEST = process.env.ENABLE_SCHEMA_PER_TEST === 'true';
const ENABLE_CLEANUP_AFTER_TEST = process.env.ENABLE_CLEANUP_AFTER_TEST === 'true';

const argGenerator: Record<AdapterName, () => Promise<AdapterArgs> | AdapterArgs> = {
  mongoose: async () => {
    const dbName = ENABLE_SCHEMA_PER_TEST
      ? `test_${crypto.randomBytes(8).toString('hex')}`
      : 'test_default';
    const baseUri =
      process.env.DATABASE_URL ||
      process.env.MONGO_URI ||
      'mongodb://admin:open-keystone-demo-password@localhost:27017';
    return {
      mongoUri: `${baseUri}${baseUri.endsWith('/') ? '' : '/'}${dbName}?authSource=admin`,
      dropDatabase: true,
    };
  },
  knex: () => {
    const schemaName = ENABLE_SCHEMA_PER_TEST
      ? `test_${crypto.randomBytes(8).toString('hex')}`
      : 'public';
    const connection =
      process.env.DATABASE_URL ||
      process.env.KNEX_URI ||
      'postgres://postgres:open-keystone-demo-password@localhost/main';
    return {
      dropDatabase: true,
      schemaName,
      knexOptions: {
        connection,
      },
    };
  },
  prisma_postgresql: () => {
    const schemaName = ENABLE_SCHEMA_PER_TEST
      ? `test_${crypto.randomBytes(8).toString('hex')}`
      : 'public';
    const url =
      process.env.DATABASE_URL || 'postgres://postgres:open-keystone-demo-password@localhost/main';
    return {
      migrationMode: 'prototype',
      dropDatabase: true,
      url,
      provider: 'postgresql',
      // Put the generated client at a unique path
      getPrismaPath: ({ prismaSchema }: { prismaSchema: string }) =>
        path.join(
          '.api-test-prisma-clients',
          crypto.createHash('sha256').update(prismaSchema).digest('hex')
        ),
      // Slice down to the hash make a valid postgres schema name
      getDbSchemaName: () => schemaName,
      // Turn this on if you need verbose debug info
      enableLogging: false,
    };
  },
};

async function createPostgresSchema(adapterArgs: KnexAdapterArgs | PrismaAdapterArgs) {
  const schemaName = 'schemaName' in adapterArgs ? adapterArgs.schemaName : adapterArgs.getDbSchemaName();
  const connectionString = 'url' in adapterArgs ? adapterArgs.url : adapterArgs.knexOptions.connection;
  const url = connectionString.split('?')[0];
  const baseConnection = url.substring(0, url.lastIndexOf('/')) + '/postgres';
  const _knex = knex({ client: 'postgres', connection: baseConnection });
  try {
    await _knex.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  } finally {
    await _knex.destroy();
  }
}

async function dropPostgresSchema(adapterArgs: KnexAdapterArgs | PrismaAdapterArgs) {
  const schemaName = 'schemaName' in adapterArgs ? adapterArgs.schemaName : adapterArgs.getDbSchemaName();
  const connectionString = 'url' in adapterArgs ? adapterArgs.url : adapterArgs.knexOptions.connection;
  const url = connectionString.split('?')[0];
  const baseConnection = url.substring(0, url.lastIndexOf('/')) + '/postgres';
  const _knex = knex({ client: 'postgres', connection: baseConnection });
  try {
    await _knex.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  } finally {
    await _knex.destroy();
  }
}

async function setupServer({
  adapterName,
  createLists = () => {},
  keystoneOptions = {},
  graphqlOptions = {},
}: {
  adapterName: AdapterName;
  createLists: (args: Keystone) => void;
  keystoneOptions?: Record<string, any>;
  graphqlOptions?: Record<string, any>;
}): Promise<{ keystone: Keystone; app: Express }> {
  const Adapter = {
    mongoose: MongooseAdapter,
    knex: KnexAdapter,
    prisma_postgresql: PrismaAdapter,
  }[adapterName];

  const adapterArgs = await argGenerator[adapterName]();

  if ((adapterName === 'knex' || adapterName === 'prisma_postgresql') && ENABLE_SCHEMA_PER_TEST) {
    await createPostgresSchema(adapterArgs as KnexAdapterArgs | PrismaAdapterArgs);
  }

  const keystone = new Keystone({
    adapter: new Adapter(adapterArgs),
    // @ts-ignore The @types/keystonejs__keystone package has the wrong type for KeystoneOptions
    defaultAccess: { list: true, field: true },
    cookieSecret: 'secretForTesting',
    ...keystoneOptions,
  });

  createLists(keystone);

  const apps = [
    new GraphQLApp({
      apiPath: '/admin/api',
      graphiqlPath: '/admin/graphiql',
      apollo: {
        tracing: true,
        cacheControl: {
          defaultMaxAge: 3600,
        },
      },
      ...graphqlOptions,
    }),
  ];

  const { middlewares } = await keystone.prepare({ dev: true, apps });

  const app = express();
  app.use(middlewares);

  return { keystone, app };
}

interface GraphqlRequestArgs {
  app: express.Application;
  query: string;
  variables?: Record<string, any>;
  headers?: Record<string, any>;
  expectedStatusCode?: number;
  operationName?: string;
}

function networkedGraphqlRequest({
  app,
  query,
  variables = undefined,
  headers = {},
  expectedStatusCode = 200,
  operationName,
}: GraphqlRequestArgs) {
  const request = supertest(app).set('Accept', 'application/json');

  Object.entries(headers).forEach(([key, value]) => request.set(key, value));

  return request
    .post('/admin/api', { query, variables, operationName })
    .then((res: ServerResponse & { text: string; statusCode: number }) => {
      expect(res.statusCode).toBe(expectedStatusCode);
      return { ...JSON.parse(res.text), res };
    })
    .catch((error: Error) => ({
      errors: [error],
    }));
}

async function teardownTestDb(keystone: any) {
  if (keystone && keystone.adapter) {
    const { schemaName } = keystone.adapter.config;
    const adapterArgs = keystone.adapter.config;

    if (
      schemaName &&
      schemaName !== 'public' &&
      (keystone.adapter.name === 'knex' || keystone.adapter.name === 'prisma')
    ) {
      try {
        if (ENABLE_CLEANUP_AFTER_TEST) {
          await dropPostgresSchema(adapterArgs);
        }
      } catch (e) {
        console.error('Error dropping schema', e);
      }
    } else {
      if (ENABLE_CLEANUP_AFTER_TEST) {
        await keystone.adapter.dropDatabase();
      }
    }
  }

  if (keystone && typeof keystone.disconnect === 'function') {
    await keystone.disconnect();
  }
}

interface Setup {
  keystone: Keystone;
  app?: Express;
  [key: string]: any;
}

function _keystoneRunner(
  adapterName: AdapterName,
  tearDownFunction: (keystone?: any) => Promise<void> | void
) {
  return function (
    setupKeystoneFn: (adapterName: AdapterName) => Promise<Setup>,
    testFn?: (setup: Setup) => Promise<void>
  ) {
    return async function () {
      let setup: Setup | undefined;
      try {
        setup = await setupKeystoneFn(adapterName);
      } catch (error) {
        await tearDownFunction();
        throw error;
      }

      const { keystone } = setup;
      await keystone.connect();

      if (!testFn) {
        await tearDownFunction(keystone);
        return;
      }

      try {
        await testFn(setup);
      } finally {
        await tearDownFunction(keystone);
      }
    };
  };
}

function _before(adapterName: AdapterName) {
  return async function (
    setupKeystone: (adapterName: AdapterName) => Promise<{ keystone: Keystone; app: Express }>
  ) {
    const { keystone, app } = await setupKeystone(adapterName);
    await keystone.connect();
    return { keystone, app };
  };
}

function _after(tearDownFunction: (keystone?: any) => Promise<void> | void) {
  return async function (keystone: Keystone) {
    await tearDownFunction(keystone);
  };
}

function multiAdapterRunners(only = process.env.TEST_ADAPTER) {
  const adapters: AdapterName[] = ['mongoose', 'knex', 'prisma_postgresql'];

  return adapters
    .map(adapterName => ({
      runner: _keystoneRunner(adapterName, teardownTestDb),
      adapterName,
      before: _before(adapterName),
      after: _after(teardownTestDb),
    }))
    .filter(a => typeof only === 'undefined' || a.adapterName === only);
}

export { setupServer, multiAdapterRunners, networkedGraphqlRequest };
