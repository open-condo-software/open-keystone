<!--[meta]
section: api
subSection: field-types
title: AuthedRelationship
[meta]-->

# AuthedRelationship

> This is the last active development release of this package as **Keystone 5** is now in a 6 to 12 month active maintenance phase. For more information please read our [Keystone 5 and beyond](https://github.com/keystonejs/keystone-5/issues/21) post.

An extension on the `Relationship` field which is automatically set to the
currently authenticated item during a create mutation.

Great for setting fields like `Post.author` or `Product.owner`, etc.

## Usage

### Basic

```js
const { AuthedRelationship } = require('@open-keystone/fields-authed-relationship');
const { Text } = require('@open-keystone/fields');

keystone.createList('User', {
  fields: {
    name: { type: Text },
  },
});

keystone.createList('Post', {
  fields: {
    // Automatically set to the currently logged in user on create
    author: {
      type: AuthedRelationship,
      ref: 'User',
    },
  },
});
```

### Complete example

This example allows "admins" to overwrite the value

```js
const { AuthedRelationship } = require('@open-keystone/fields-authed-relationship');
const { Checkbox, Text } = require('@open-keystone/fields');

keystone.createList('User', {
  fields: {
    name: { type: Text },
    isAdmin: { type: Checkbox, default: false },
  },
});

const isAdmin = ({ authentication: { item } }) => !!item && item.isAdmin;

keystone.createList('Post', {
  fields: {
    author: {
      type: AuthedRelationship,
      ref: 'User',
      access: {
        create: isAdmin,
        update: isAdmin,
      },
    },
  },
});
```

### Config

| Option       | Type      | Default | Description                      |
| ------------ | --------- | ------- | -------------------------------- |
| `isRequired` | `Boolean` | `false` | Does this field require a value? |

## Differences from `Relationship`

- No `many: true`. This field is purely for a to-single relationship and cannot
  be used to refer to more than one item.
- Cannot specify a `defaultValue`. The entire purpose of this field is to
  provide that method for you.
- When setting `isRequired`, it will be checked during the "default value" phase
  of the mutation lifecycle. This means it may throw an error earlier than other
  fields
- Default access control set to `{ create: false, read: true, update: false }`
- Access control _does not_ respect any Keystone-level `defaultAccess`
