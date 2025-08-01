import path from 'path';
import crypto from 'crypto';
import { ServerResponse } from 'http';
import express from 'express';
import type { Express } from 'express';
// @ts-ignore
import supertest from 'supertest-light';
import { MongoMemoryServer } from 'mongodb-memory-server';
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

const argGenerator = {
  mongoose: getMongoMemoryServerConfig,
  knex: () => ({
    dropDatabase: true,
    knexOptions: {
      connection:
        process.env.DATABASE_URL || process.env.KNEX_URI || 'postgres://localhost/keystone',
    },
  }),
  prisma_postgresql: () => ({
    migrationMode: 'prototype',
    dropDatabase: true,
    url: process.env.DATABASE_URL || '',
    provider: 'postgresql',
    // Put the generated client at a unique path
    getPrismaPath: ({ prismaSchema }: { prismaSchema: string }) =>
      path.join(
        '.api-test-prisma-clients',
        crypto.createHash('sha256').update(prismaSchema).digest('hex')
      ),
    // Slice down to the hash make a valid postgres schema name
    getDbSchemaName: ({ prismaSchema }: { prismaSchema: string }) =>
      crypto.createHash('sha256').update(prismaSchema).digest('hex').slice(0, 16),
    // Turn this on if you need verbose debug info
    enableLogging: false,
  }),
};

async function setupServer({
  adapterName,
  schemaName = 'public',
  schemaNames = ['public'],
  createLists = () => {},
  keystoneOptions,
  graphqlOptions = {},
}: {
  adapterName: 'mongoose' | 'knex' | 'prisma_postgresql';
  schemaName: string;
  schemaNames: string[];
  createLists: (args: Keystone<string>) => void;
  keystoneOptions: Record<string, any>; // FIXME: should match args of Keystone constructor
  graphqlOptions: Record<string, any>; // FIXME: should match args of GraphQLApp constuctor
}): Promise<{ keystone: Keystone; app: Express }> {
  const Adapter = {
    mongoose: MongooseAdapter,
    knex: KnexAdapter,
    prisma_postgresql: PrismaAdapter,
  }[adapterName];

  const keystone = new Keystone({
    adapter: new Adapter(await argGenerator[adapterName]()),
    // @ts-ignore The @types/keystonejs__keystone package has the wrong type for KeystoneOptions
    defaultAccess: { list: true, field: true },
    schemaNames,
    cookieSecret: 'secretForTesting',
    ...keystoneOptions,
  });

  createLists(keystone);

  const apps = [
    new GraphQLApp({
      schemaName,
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

function networkedGraphqlRequest({
  app,
  query,
  variables = undefined,
  headers = {},
  expectedStatusCode = 200,
  operationName,
}: {
  app: express.Application;
  query: string;
  variables?: Record<string, any>;
  headers: Record<string, any>;
  expectedStatusCode: number;
  operationName: string;
}) {
  const request = supertest(app).set('Accept', 'application/json');

  Object.entries(headers).forEach(([key, value]) => request.set(key, value));

  return request
    .post('/admin/api', { query, variables, operationName })
    .then((res: ServerResponse & { text: string }) => {
      expect(res.statusCode).toBe(expectedStatusCode);
      return { ...JSON.parse(res.text), res };
    })
    .catch((error: Error) => ({
      errors: [error],
    }));
}

// One instance per node.js thread which cleans itself up when the main process
// exits
let mongoServer: MongoMemoryServer | undefined | null;
let mongoServerReferences = 0;

async function getMongoMemoryServerConfig() {
  mongoServer = mongoServer || (await MongoMemoryServer.create());
  mongoServerReferences++;
  // In theory the dbName can contain query params so lets parse it then extract the db name
  const dbName = `db_${crypto.randomBytes(16).toString('hex')}`;
  const mongoUri = await mongoServer.getUri(dbName);

  return { mongoUri, dbName };
}

async function teardownMongoMemoryServer() {
  mongoServerReferences--;
  if (mongoServerReferences < 0) {
    mongoServerReferences = 0;
  }

  if (mongoServerReferences > 0) {
    return Promise.resolve();
  }

  if (!mongoServer) {
    return Promise.resolve();
  }
  await mongoServer.stop();
  mongoServer = null;
}

type Setup = { keystone: Keystone<string>; context: any };

function _keystoneRunner(adapterName: AdapterName, tearDownFunction: () => Promise<void> | void) {
  return function (
    setupKeystoneFn: (adaptername: AdapterName) => Promise<Setup>,
    testFn: (setup: Setup) => Promise<void>
  ) {
    return async function () {
      if (!testFn) {
        // If a testFn is not defined then we just need
        // to excute setup and tear down in isolation.
        try {
          await setupKeystoneFn(adapterName);
        } catch (error) {
          await tearDownFunction();
          throw error;
        }
        return;
      }
      const setup = await setupKeystoneFn(adapterName);
      const { keystone } = setup;

      await keystone.connect();

      try {
        await testFn(setup);
      } finally {
        await keystone.disconnect();
        await tearDownFunction();
      }
    };
  };
}

function _before(adapterName: AdapterName) {
  return async function (
    setupKeystone: (adapterName: AdapterName) => Promise<{ keystone: Keystone<string>; app: any }>
  ) {
    const { keystone, app } = await setupKeystone(adapterName);
    await keystone.connect();
    return { keystone, app };
  };
}

function _after(tearDownFunction: () => Promise<void> | void) {
  return async function (keystone: Keystone<string>) {
    await keystone.disconnect();
    await tearDownFunction();
  };
}

function multiAdapterRunners(only = process.env.TEST_ADAPTER) {
  return [
    {
      runner: _keystoneRunner('mongoose', teardownMongoMemoryServer),
      adapterName: 'mongoose',
      before: _before('mongoose'),
      after: _after(teardownMongoMemoryServer),
    },
    {
      runner: _keystoneRunner('knex', () => {}),
      adapterName: 'knex',
      before: _before('knex'),
      after: _after(() => {}),
    },
    {
      runner: _keystoneRunner('prisma_postgresql', () => {}),
      adapterName: 'prisma_postgresql',
      before: _before('prisma_postgresql'),
      after: _after(() => {}),
    },
  ].filter(a => typeof only === 'undefined' || a.adapterName === only);
}

export { setupServer, multiAdapterRunners, networkedGraphqlRequest };
