<!--[meta]
section: api
subSection: apps
title: GraphQL Playground App
draft: true
[meta]-->

# GraphQL Playground App

> This is the last active development release of this package as **Keystone 5** is now in a 6 to 12 month active maintenance phase. For more information please read our [Keystone 5 and beyond](https://github.com/keystonejs/keystone-5/issues/21) post.

[![View changelog](https://img.shields.io/badge/changelogs.xyz-Explore%20Changelog-brightgreen)](https://changelogs.xyz/@open-keystone/app-graphql-playground)

A KeystoneJS App that creates an Apollo GraphQL playground.

## Usage

```javascript
const { Keystone } = require('@open-keystone/keystone');
const { GraphQLApp } = require('@open-keystone/app-graphql');
const { GraphQLPlaygroundApp } = require('@open-keystone/app-graphql-playground');
const { AdminUIApp } = require('@open-keystone/app-admin-ui');

// Ensure that the GraphQLApp and GraphQLAppPlayground are referring to the same endpoint
const apiPath = '/admin/api';

module.exports = {
  keystone: new Keystone(),
  apps: [
    // This should come before the GraphQLApp, as it sets up the dev query middleware
    new GraphQLPlaygroundApp({ apiPath })
    // Disable the default playground on this app
    new GraphQLApp({ apiPath, graphiqlPath: undefined }),
    new AdminUIApp()
  ],
};
```

## Config

| Option         | Type     | Default           | Description                               |
| -------------- | -------- | ----------------- | ----------------------------------------- |
| `apiPath`      | `String` | `/admin/api`      | Change the API path                       |
| `graphiqlPath` | `String` | `/admin/graphiql` | Change the Apollo GraphQL playground path |
