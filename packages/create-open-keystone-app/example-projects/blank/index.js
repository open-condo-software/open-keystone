const { Keystone } = require('@open-keystone/keystone');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');
/* keystone-cli: generated-code */
const { MongooseAdapter: Adapter } = require('@open-keystone/adapter-mongoose');
const PROJECT_NAME = 'My OpenKeystone Project';
const adapterConfig = {};
/* /keystone-cli: generated-code */

/**
 * You've got a new OpenKeystone Project! Things you might want to do next:
 * - Add adapter config options (See: https://github.com/open-condo-software/open-keystone/blob/main/docs/quick-start/adapters.md)
 * - Next step: https://github.com/open-condo-software/open-keystone/blob/main/docs/quick-start/README.md#next-steps
 */

const keystone = new Keystone({
  adapter: new Adapter(adapterConfig),
});

module.exports = {
  keystone,
  apps: [new GraphQLApp(), new AdminUIApp({ name: PROJECT_NAME, enableDefaultRoute: true })],
};
