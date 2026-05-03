const { Keystone } = require('@open-keystone/keystone');
const { PrismaAdapter } = require('@open-keystone/adapter-prisma');
const { Text } = require('@open-keystone/fields');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');
const { StaticApp } = require('@open-keystone/app-static');

const keystone = new Keystone({
  adapter: new PrismaAdapter({
    provider: 'sqlite',
    url: 'file:./todo.db',
    migrationMode: 'prototype',
  }),
});

keystone.createList('Todo', {
  schemaDoc: 'A list of things which need to be done',
  fields: {
    name: { type: Text, schemaDoc: 'This is the thing you need to do', isRequired: true },
  },
});

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new StaticApp({ path: '/', src: 'public' }),
    // Setup the optional Admin UI
    new AdminUIApp({ name: 'Keystone To-Do List', enableDefaultRoute: true }),
  ],
};
