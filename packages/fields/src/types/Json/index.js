import { Json, MongoJsonInterface, KnexJsonInterface, PrismaJsonInterface } from './Implementation';
import { resolveView } from '../../resolve-view';

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
    Field: resolveView('types/Text/views/Field'),
    Filter: resolveView('types/Text/views/Filter'),
  },
};
