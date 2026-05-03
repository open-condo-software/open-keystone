const { Keystone } = require('@open-keystone/keystone');
const { Text } = require('@open-keystone/fields');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');
const { NuxtApp } = require('@open-keystone/app-nuxt');

/* keystone-cli: generated-code */
const { MongooseAdapter: Adapter } = require('@open-keystone/adapter-mongoose');
const PROJECT_NAME = 'Nuxt';
const adapterConfig = {};
/* /keystone-cli: generated-code */

const keystone = new Keystone({
  adapter: new Adapter(adapterConfig),
});

keystone.createList('Todo', {
  schemaDoc: 'A list of things which need to be done',
  fields: {
    name: { type: Text, schemaDoc: 'This is the thing you need to do' },
  },
});

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new AdminUIApp({ name: PROJECT_NAME }),
    new NuxtApp({
      srcDir: 'src',
      buildDir: 'dist',
    }),
  ],
};
