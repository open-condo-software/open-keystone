<!--[meta]
section: api
subSection: apps
title: GraphQL app
[meta]-->

# GraphQL app

> This is the last active development release of this package as **Keystone 5** is now in a 6 to 12 month active maintenance phase. For more information please read our [Keystone 5 and beyond](https://github.com/keystonejs/keystone-5/issues/21) post.

[![View changelog](https://img.shields.io/badge/changelogs.xyz-Explore%20Changelog-brightgreen)](https://changelogs.xyz/@open-keystone/app-graphql)

A KeystoneJS app that creates a GraphQL API and [GraphiQL](https://github.com/graphql/graphiql/blob/master/packages/graphiql/README.md) playground.

> **Note:** The GraphiQL playground is disabled in production mode.

For information about writing queries and mutations for KeystoneJS see the [Introduction to KeystoneJS' GraphQL API](https://keystonejs.com/guides/intro-to-graphql).

## Usage

```javascript
const { Keystone } = require('@open-keystone/keystone');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');

module.exports = {
  keystone: new Keystone(),
  apps: [
    new GraphQLApp({
      // All config keys are optional. Default values are shown here for completeness.
      apiPath: '/admin/api',
      graphiqlPath: '/admin/graphiql',
      schemaName: 'admin',
      apollo: {},
    }),
    new AdminUIApp(),
  ],
};
```

## Config

| Option         | Type     | Default           | Description                                      |
| -------------- | -------- | ----------------- | ------------------------------------------------ |
| `apiPath`      | `String` | `/admin/api`      | Change the API path                              |
| `graphiqlPath` | `String` | `/admin/graphiql` | Change the GraphiQL playground path              |
| `schemaName`   | `String` | `admin`           | Change the graphQL schema name (not recommended) |
| `apollo`       | `Object` | `{}`              | Options passed directly to Apollo Server         |

## Setting a custom schemaName

To use a custom `schemaName`, please ensure it is also passed in to the [keystone constructor](https://www.keystonejs.com/keystonejs/keystone/#schemanames) at initialization.
