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

      describe('Tricky values', () => {
        const trickyValues = [
          { name: 'null object', value: null },
          // NOTE(pahaz): Mongoose minimizes empty objects to null by default
          { name: 'empty object', value: {}, mongoose: null },
          { name: 'empty array', value: [] },
          { name: 'boolean true', value: true },
          { name: 'boolean false', value: false },
          { name: 'number', value: 123 },
          { name: 'zero', value: 0 },
          { name: 'float', value: 1.23 },
          { name: 'empty string', value: '' },
          { name: 'string', value: 'simple string' },
          { name: 'unicode', value: '🚀 unicode' },
          {
            name: 'complex nested',
            value: { nested: { a: 1, b: null, c: [true, false, 'str', {}, []] } },
          },
          { name: 'mixed array', value: [null, 1, 'a', {}] },
          { name: 'nested arrays', value: [[[null, []]], false, 0, '', 'a', {}] },
        ];

        trickyValues.forEach(({ name, value, ...expected }) => {
          test(
            `correctly handles ${name}`,
            runner(setupKeystone, async ({ keystone }) => {
              const item = { meta: value };
              const createPost = await createItem({ keystone, listKey: 'Post', item });

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

              if (typeof expected[adapterName] !== 'undefined') {
                expect(data.Post.meta).toEqual(expected[adapterName]);
              } else {
                expect(data.Post.meta).toEqual(value);
              }
            })
          );
        });
      });

      describe('Filtering by tricky values', () => {
        test(
          'filters by string value',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({ keystone, listKey: 'Post', item: { title: 'v1', meta: 'a' } });
            await createItem({ keystone, listKey: 'Post', item: { title: 'v2', meta: 'b' } });
            const { data } = await keystone.executeGraphQL({
              query: 'query($v: JSON) { allPosts(where: { meta: $v }) { title } }',
              variables: { v: 'a' },
            });
            expect(data.allPosts).toEqual([{ title: 'v1' }]);
          })
        );

        test(
          'filters by boolean value',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({ keystone, listKey: 'Post', item: { title: 'v1', meta: true } });
            await createItem({ keystone, listKey: 'Post', item: { title: 'v2', meta: false } });
            const { data } = await keystone.executeGraphQL({
              query: 'query($v: JSON) { allPosts(where: { meta: $v }) { title } }',
              variables: { v: true },
            });
            expect(data.allPosts).toEqual([{ title: 'v1' }]);
          })
        );

        test(
          'filters by number value',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({ keystone, listKey: 'Post', item: { title: 'v1', meta: 100 } });
            await createItem({ keystone, listKey: 'Post', item: { title: 'v2', meta: 200 } });
            const { data } = await keystone.executeGraphQL({
              query: 'query($v: JSON) { allPosts(where: { meta: $v }) { title } }',
              variables: { v: 100 },
            });
            expect(data.allPosts).toEqual([{ title: 'v1' }]);
          })
        );

        test(
          'filters by object value',
          runner(setupKeystone, async ({ keystone }) => {
            if (adapterName === 'mongoose') {
              // Mongoose adapter in Keystone 5 fails to determine field responsible for object-based query on JSON fields
              return;
            }
            await createItem({ keystone, listKey: 'Post', item: { title: 'v1', meta: { a: 1 } } });
            await createItem({ keystone, listKey: 'Post', item: { title: 'v2', meta: { a: 2 } } });
            const { data, errors } = await keystone.executeGraphQL({
              query: 'query($v: JSON) { allPosts(where: { meta: $v }) { title } }',
              variables: { v: { a: 1 } },
            });
            expect(errors).toBe(undefined);
            expect(data.allPosts).toEqual([{ title: 'v1' }]);
          })
        );

        test(
          'filters by array value',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({ keystone, listKey: 'Post', item: { title: 'v1', meta: [1, 2] } });
            await createItem({ keystone, listKey: 'Post', item: { title: 'v2', meta: [1, 3] } });
            const { data } = await keystone.executeGraphQL({
              query: 'query($v: JSON) { allPosts(where: { meta: $v }) { title } }',
              variables: { v: [1, 2] },
            });
            expect(data.allPosts).toEqual([{ title: 'v1' }]);
          })
        );

        test(
          'filters by null value',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({ keystone, listKey: 'Post', item: { title: 'v1', meta: null } });
            await createItem({
              keystone,
              listKey: 'Post',
              item: { title: 'v2', meta: 'not null' },
            });
            const { data } = await keystone.executeGraphQL({
              query: 'query($v: JSON) { allPosts(where: { meta: $v }) { title } }',
              variables: { v: null },
            });
            expect(data.allPosts).toEqual([{ title: 'v1' }]);
          })
        );
      });
    });
  })
);
