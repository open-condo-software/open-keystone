const { Keystone } = require('@open-keystone/keystone');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');
/* keystone-cli: generated-code */
const { MongooseAdapter: Adapter } = require('@open-keystone/adapter-mongoose');
const PROJECT_NAME = 'My KeystoneJS Project';
const adapterConfig = {};
/* /keystone-cli: generated-code */

/**
 * You've got a new KeystoneJS Project! Things you might want to do next:
 * - Add adapter config options (See: https://keystonejs.com/keystonejs/adapter-mongoose/)
 * - Select configure access control and authentication (See: https://keystonejs.com/api/access-control)
 */

const keystone = new Keystone({
  adapter: new Adapter(adapterConfig),
});

module.exports = {
  keystone,
  apps: [new GraphQLApp(), new AdminUIApp({ name: PROJECT_NAME, enableDefaultRoute: true })],
};
