<!--[meta]
section: list-plugins
title: singleton
[meta]-->

# singleton Plugin

This plugin makes a list singleton by allowing only one item in the list. Useful for list which must contain only one items.

## Usage

```js
const { singleton } = require('@open-keystone/list-plugins');

keystone.createList('ListWithPlugin', {
  fields: {...},
  plugins: [
    singleton(),
  ],
});
```
