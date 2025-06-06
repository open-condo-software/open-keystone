<!--[meta]
section: api
subSection: database-adapters
title: Mongoose adapter
[meta]-->

# Mongoose database adapter

> This is the last active development release of this package as **Keystone 5** is now in a 6 to 12 month active maintenance phase. For more information please read our [Keystone 5 and beyond](https://github.com/keystonejs/keystone-5/issues/21) post.

[![View changelog](https://img.shields.io/badge/changelogs.xyz-Explore%20Changelog-brightgreen)](https://changelogs.xyz/@open-keystone/adapter-mongoose)

## Usage

```javascript
const { MongooseAdapter } = require('@open-keystone/adapter-mongoose');

const keystone = new Keystone({
  adapter: new MongooseAdapter({...}),
});
```

## Config

### `mongoUri` (required)

This is used as the `uri` parameter for `mongoose.connect()`.

_**Default:**_ Environment variable (see below) or `'mongodb://localhost/<DATABASE_NAME>'`

If not specified, KeystoneJS will look for one of the following environment variables:

- `CONNECT_TO`
- `DATABASE_URL`
- `MONGO_URI`
- `MONGODB_URI`
- `MONGO_URL`
- `MONGODB_URL`
- `MONGOLAB_URI`
- `MONGOLAB_URL`

### Mongoose options (optional)

Additional Mongoose config options are passed directly through to `mongoose.connect()`.

_**Default:**_

```javascript
{
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
}
```

See the [Mongoose docs](https://mongoosejs.com/docs/api.html#mongoose_Mongoose-connect) for a detailed list of options.
