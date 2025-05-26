//imports for Keystone app core
const { Keystone } = require('@open-keystone/keystone');
const { PasswordAuthStrategy } = require('@open-keystone/auth-password');
const { MongooseAdapter } = require('@open-keystone/adapter-mongoose');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');
const { NextApp } = require('@open-keystone/app-next');
const { StaticApp } = require('@open-keystone/app-static');
const { createItems } = require('@open-keystone/server-side-graphql-client');

const { staticRoute, staticPath, distDir } = require('./config');
const { User, Post, PostCategory, Comment } = require('./schema');

const keystone = new Keystone({
  adapter: new MongooseAdapter({ mongoUri: 'mongodb://localhost/keystone-demo-blog' }),
  onConnect: async () => {
    // Initialise some data.
    // NOTE: This is only for demo purposes and should not be used in production
    const users = await keystone.lists.User.adapter.findAll();
    if (!users.length) {
      const initialData = require('./initialData');
      await createItems({ keystone, listKey: 'User', items: initialData.User });
    }
  },
});

keystone.createList('User', User);
keystone.createList('Post', Post);
keystone.createList('PostCategory', PostCategory);
keystone.createList('Comment', Comment);

const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
  config: { protectIdentities: process.env.NODE_ENV === 'production' },
});

const adminApp = new AdminUIApp({
  name: 'Keystone Demo Blog',
  adminPath: '/admin',
  hooks: require.resolve('./admin/'),
  authStrategy,
  isAccessAllowed: ({ authentication: { item: user } }) => !!user && !!user.isAdmin,
});

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new StaticApp({ path: staticRoute, src: staticPath }),
    adminApp,
    new NextApp({ dir: 'app' }),
  ],
  distDir,
};
