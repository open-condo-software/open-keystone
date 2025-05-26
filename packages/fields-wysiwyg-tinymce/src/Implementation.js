import { Text } from '@open-keystone/fields';

export class WysiwygImplementation extends Text.implementation {
  constructor(path, { editorConfig }) {
    super(...arguments);
    this.editorConfig = editorConfig;
  }

  extendAdminMeta(meta) {
    return {
      ...meta,
      editorConfig: this.editorConfig,
    };
  }
}
