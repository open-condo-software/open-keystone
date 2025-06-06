import { Block } from '@open-keystone/fields-content/Block';
import { OEmbed } from '.';
import { Relationship as RelationshipType } from '@open-keystone/fields';

import { resolveView } from './resolve-view';

const RelationshipWrapper = {
  ...RelationshipType,
  implementation: class extends RelationshipType.implementation {
    async resolveNestedOperations(operations, item, context, ...args) {
      const result = await super.resolveNestedOperations(operations, item, context, ...args);
      context._blockMeta = context._blockMeta || {};
      context._blockMeta[this.listKey] = context._blockMeta[this.listKey] || {};
      context._blockMeta[this.listKey][this.path] = result;
      return result;
    }
  },
};

export class OEmbedBlock extends Block {
  constructor({ adapter }, { fromList, joinList, createAuxList, getListByKey }) {
    super(...arguments);

    this.joinList = joinList;
    this.adapter = adapter;

    const auxListKey =
      getListByKey(fromList).adapter.parentAdapter.name === 'prisma'
        ? `KS_Block_${fromList}_${this.type}`
        : `_Block_${fromList}_${this.type}`;

    // Ensure the list is only instantiated once per server instance.
    let auxList = getListByKey(auxListKey);

    if (!auxList) {
      auxList = createAuxList(auxListKey, {
        fields: {
          embed: {
            type: OEmbed,
            isRequired: true,
            adapter,
            schemaDoc: 'oEmbed data as returned by the passed adapter',
          },
          // Useful for doing reverse lookups such as:
          // - "Get all embeds in this post"
          // - "List all users mentioned in comment"
          from: {
            type: RelationshipType,
            isRequired: true,
            ref: `${joinList}.${this.path}`,
            schemaDoc:
              'A reference back to the Slate.js Serialised Document this embed is contained within',
          },
        },
      });
    }

    this.auxList = auxList;
  }

  get type() {
    return 'oEmbed';
  }

  get path() {
    return 'oEmbeds';
  }

  getFieldDefinitions() {
    return {
      [this.path]: {
        type: RelationshipWrapper,
        ref: `${this.auxList.key}.from`,
        many: true,
        schemaDoc: 'Embeds which have been added to the Content field',
      },
    };
  }

  getMutationOperationResults({ context }) {
    return {
      [this.path]:
        context._blockMeta &&
        context._blockMeta[this.joinList] &&
        context._blockMeta[this.joinList][this.path],
    };
  }

  getAdminViews() {
    return [
      resolveView('views/blocks/oembed'),
      ...(typeof this.adapter.getAdminViews === 'function' ? this.adapter.getAdminViews() : []),
    ];
  }

  getViewOptions() {
    return {
      query: `
        oEmbeds {
          id
          embed {
            type
            originalUrl
            version
            title
            cacheAge
            provider {
              name
              url
            }
            author {
              name
              url
            }
            thumbnail {
              url
              width
              height
            }
            ...on OEmbedPhoto {
              url
              width
              height
            }
            ...on OEmbedVideo {
              html
              width
              height
            }
            ...on OEmbedRich {
              html
              width
              height
            }
          }
        }
      `,
      ...(typeof this.adapter.getViewOptions === 'function' ? this.adapter.getViewOptions() : {}),
    };
  }
}
