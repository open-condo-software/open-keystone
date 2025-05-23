import path from 'path';
import { Text } from '@open-keystone/fields';

const pkgDir = path.dirname(require.resolve('@open-keystone/fields-markdown/package.json'));

export let Markdown = {
  type: 'Markdown',
  implementation: Text.implementation,
  views: {
    Controller: Text.views.Controller,
    Field: path.join(pkgDir, 'views/Field'),
    Filter: Text.views.Filter,
  },
  adapters: Text.adapters,
};
