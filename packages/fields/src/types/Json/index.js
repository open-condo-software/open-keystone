import { Json, MongoJsonInterface, KnexJsonInterface, PrismaJsonInterface } from './Implementation';
import { resolveView } from '../../resolve-view';
import Text from '../Text';

export default {
  type: 'Json',
  implementation: Json,
  adapters: {
    mongoose: MongoJsonInterface,
    knex: KnexJsonInterface,
    prisma: PrismaJsonInterface,
  },
  views: {
    Controller: resolveView('types/Json/views/Controller'),
    Field: Text.views.Field,
    Cell: Text.views.Cell,
  },
};
