const { Keystone } = require('@open-keystone/keystone');
const { Text, Password, Checkbox } = require('@open-keystone/fields');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');
const { StaticApp } = require('@open-keystone/app-static');

const { staticRoute, staticPath } = require('./config');

const { PrismaAdapter } = require('@open-keystone/adapter-prisma');

const keystone = new Keystone({
  adapter: new PrismaAdapter(),
  cookieSecret: 'qwerty',
});

keystone.createList('User', {
  fields: {
    name: { type: Text },
    email: { type: Text, isUnique: true },
    password: { type: Password, isRequired: true },
    isAdmin: { type: Checkbox },
  },
});

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new StaticApp({ path: staticRoute, src: staticPath }),
    new AdminUIApp({ name: 'Cypress Test Project Client Validation', enableDefaultRoute: true }),
  ],
};
