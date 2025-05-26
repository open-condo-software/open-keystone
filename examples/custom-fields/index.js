const { Keystone } = require('@open-keystone/keystone');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');
const { Text } = require('@open-keystone/fields');
const { MongooseAdapter } = require('@open-keystone/adapter-mongoose');
const Stars = require('./fields/Stars');
const MultiCheck = require('./fields/MultiCheck');

const keystone = new Keystone({
  adapter: new MongooseAdapter({ mongoUri: 'mongodb://localhost/custom-field' }),
});

keystone.createList('Movie', {
  fields: {
    name: { type: Text },
    rating: { type: Stars, starCount: 5 },
    categories: {
      type: MultiCheck,
      options: ['Action', 'Comedy', 'Drama'],
      defaultValue: [true, false, false],
    },
  },
});

module.exports = {
  keystone,
  apps: [new GraphQLApp(), new AdminUIApp({ name: 'custom-field', enableDefaultRoute: true })],
};
