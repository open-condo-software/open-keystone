import {
  JsonImplementation,
  JsonKnexFieldAdapter,
  JsonMongooseFieldAdapter,
  JsonPrismaFieldAdapter,
} from './Implementation';
import { resolveView } from '../../resolve-view';
import Text from '../Text';

export default {
  type: 'Json',
  implementation: JsonImplementation,
  adapters: {
    knex: JsonKnexFieldAdapter,
    mongoose: JsonMongooseFieldAdapter,
    prisma: JsonPrismaFieldAdapter,
  },
  views: {
    Controller: resolveView('types/Json/views/Controller'),
    Field: Text.views.Field,
    Cell: Text.views.Cell,
  },
};
