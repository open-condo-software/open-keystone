import path from 'path';
import {
  MongoIdImplementation,
  MongooseMongoIdInterface,
  KnexMongoIdInterface,
  PrismaMongoIdInterface,
} from './Implementation';
import { Text } from '@open-keystone/fields';

const pkgDir = path.dirname(require.resolve('@open-keystone/fields-mongoid/package.json'));

export const MongoId = {
  type: 'MongoId',
  implementation: MongoIdImplementation,
  views: {
    Controller: path.join(pkgDir, 'views/Controller'),
    Field: Text.views.Field,
    Filter: path.join(pkgDir, 'views/Filter'),
  },
  adapters: {
    knex: KnexMongoIdInterface,
    mongoose: MongooseMongoIdInterface,
    prisma: PrismaMongoIdInterface,
  },

  primaryKeyDefaults: {
    knex: {
      getConfig: () => {
        throw (
          `The MongoId field type doesn't provide a default primary key field configuration for knex. ` +
          `You'll need to supply your own 'id' field for each list or use a different field type for your ` +
          `ids (eg '@open-keystone/fields-auto-increment').`
        );
      },
    },
    prisma: {
      getConfig: () => {
        throw (
          `The MongoId field type doesn't provide a default primary key field configuration for Prisma. ` +
          `You'll need to supply your own 'id' field for each list or use a different field type for your ` +
          `ids (eg '@open-keystone/fields-auto-increment').`
        );
      },
    },
    mongoose: {
      getConfig: () => ({ type: MongoId }),
    },
  },
};
