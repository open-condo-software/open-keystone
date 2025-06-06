<!--[meta]
section: api
subSection: field-types
title: Wysiwyg
[meta]-->

# Wysiwyg

> This is the last active development release of this package as **Keystone 5** is now in a 6 to 12 month active maintenance phase. For more information please read our [Keystone 5 and beyond](https://github.com/keystonejs/keystone-5/issues/21) post.

This field inserts a string path into your schema based on the `Text` field type implementation, and renders a WYSIWYG editor in the Admin UI using [TinyMCE](https://www.tiny.cloud/)

## Usage

This package isn't included with the keystone fields package and needs to be installed with `yarn add @open-keystone/fields-wysiwyg-tinymce` or `npm install @open-keystone/fields-wysiwyg-tinymce`

Then import it, and use it like any other field:

```js
const { Wysiwyg } = require('@open-keystone/fields-wysiwyg-tinymce');
```

## Config

### `editorConfig`

**Default:** `{}`

Accepts any [TinyMCE config options](https://www.tiny.cloud/docs/configure/). These will be passed to `tinymce.init` and can be used to override Keystone.js' default editor appearance and functionality.
