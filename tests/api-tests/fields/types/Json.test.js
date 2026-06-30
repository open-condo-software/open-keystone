const { multiAdapterRunners, setupServer } = require('@open-keystone/test-utils');
const { Text, Json } = require('@open-keystone/fields');
const { createItem } = require('@open-keystone/server-side-graphql-client');

function setupKeystone(adapterName) {
  return setupServer({
    adapterName,
    createLists: keystone => {
      keystone.createList('Post', {
        fields: {
          title: { type: Text },
          meta: { type: Json },
        },
      });
    },
  });
}

multiAdapterRunners().map(({ runner, adapterName }) =>
  describe(`Adapter: ${adapterName}`, () => {
    describe('Json type', () => {
      test(
        'is present in the schema',
        runner(setupKeystone, async ({ keystone }) => {
          const {
            data: { __schema },
            errors,
          } = await keystone.executeGraphQL({
            query: `
        query {
          __schema {
            types {
              name
              kind
              fields {
                name
                type {
                  name
                }
              }
            }
          }
        }
      `,
          });
          expect(errors).toBe(undefined);
          expect(__schema).toHaveProperty('types');
          expect(__schema.types).toMatchObject(
            expect.arrayContaining([
              expect.objectContaining({
                name: 'JSON',
                kind: 'SCALAR',
              }),
            ])
          );

          expect(__schema.types).toMatchObject(
            expect.arrayContaining([
              expect.objectContaining({
                name: 'Post',
                fields: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'meta',
                    type: {
                      name: 'JSON',
                    },
                  }),
                ]),
              }),
            ])
          );
        })
      );

      test(
        'response is serialized as a JSON object',
        runner(setupKeystone, async ({ keystone }) => {
          const meta = { a: 1, b: 'two', c: true, d: [1, 2, 3], e: { f: 5 } };

          const createPost = await createItem({ keystone, listKey: 'Post', item: { meta } });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
        query {
          Post(where: { id: "${createPost.id}" }) {
            meta
          }
        }
    `,
          });
          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('Post.meta');
          expect(data.Post.meta).toEqual(meta);
        })
      );

      test(
        'input type is accepted as a JSON object',
        runner(setupKeystone, async ({ keystone }) => {
          const meta = { foo: 'bar' };

          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          createPost(data: { meta: $meta }) {
            meta
          }
        }
    `,
            variables: { meta },
          });

          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('createPost.meta');
          expect(data.createPost.meta).toEqual(meta);
        })
      );

      test(
        'correctly overrides with new value',
        runner(setupKeystone, async ({ keystone }) => {
          const meta = { a: 1 };
          const updatedMeta = { b: 2 };

          const createPost = await createItem({ keystone, listKey: 'Post', item: { meta } });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          updatePost(id: "${createPost.id}", data: { meta: $meta }) {
            meta
          }
        }
    `,
            variables: { meta: updatedMeta },
          });
          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('updatePost.meta');
          expect(data.updatePost.meta).toEqual(updatedMeta);
        })
      );

      test(
        'allows replacing value with null',
        runner(setupKeystone, async ({ keystone }) => {
          const meta = { a: 1 };

          const createPost = await createItem({ keystone, listKey: 'Post', item: { meta } });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation {
          updatePost(id: "${createPost.id}", data: { meta: null }) {
            meta
          }
        }
    `,
          });
          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('updatePost.meta', null);
        })
      );

      test(
        'allows initialising to null',
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation {
          createPost(data: { meta: null }) {
            meta
          }
        }
    `,
          });
          expect(errors).toBe(undefined);
          expect(data).toHaveProperty('createPost.meta', null);
        })
      );
    });
  })
);
