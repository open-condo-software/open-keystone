<!--[meta]
section: api
subSection: apps
title: GraphQL Schema Router
[meta]-->

# GraphQL Schema Router

> This is the last active development release of this package as **Keystone 5** is now in a 6 to 12 month active maintenance phase. For more information please read our [Keystone 5 and beyond](https://github.com/keystonejs/keystone-5/issues/21) post.

[![View changelog](https://img.shields.io/badge/changelogs.xyz-Explore%20Changelog-brightgreen)](https://changelogs.xyz/@open-keystone/app-schema-router)

A KeystoneJS App that route requests to different GraphQL schemas.

The `SchemaRouterApp` allows you to define a `routerFn` which takes `(req, res)` and returns
a `routerId`, which is used to pick between different GraphQL schemas which exist at the same
`apiPath`.

## Usage

```javascript
const { Keystone } = require('@open-keystone/keystone');
const { GraphQLAppPlayground } = require('@open-keystone/app-graphql-playground');
const { SchemaRouterApp } = require('@open-keystone/app-schema-router');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');

module.exports = {
  keystone: new Keystone(),
  apps: [
    new GraphQLAppPlayground({ apiPath })
    new SchemaRouterApp({
      apiPath,
      routerFn: (req) => req.session.keystoneItemId ? 'private' : 'public',
      apps: {
        public: new GraphQLApp({ apiPath, schemaName: 'public', graphiqlPath: undefined }),
        private: new GraphQLApp({ apiPath, schemaName: 'private', graphiqlPath: undefined }),
      },
    }),
    new AdminUIApp()
  ],
};
```

## Config

| Option     | Type       | Default      | Description                                                    |
| ---------- | ---------- | ------------ | -------------------------------------------------------------- |
| `apiPath`  | `String`   | `/admin/api` | The GraphQL API path                                           |
| `routerFn` | `Function` | `() => {}`   | A function which takes `(req, res)` and returns a `routerId`   |
| `apps`     | `Object`   | `{}`         | An object with `routerId`s as keys and `GraphQLApp`s as values |
