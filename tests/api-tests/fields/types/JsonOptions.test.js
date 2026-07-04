const { multiAdapterRunners, setupServer } = require('@open-keystone/test-utils');
const { Text, Json } = require('@open-keystone/fields');
const { createItem, updateItem } = require('@open-keystone/server-side-graphql-client');

function setupKeystone(adapterName) {
  return setupServer({
    adapterName,
    createLists: keystone => {
      keystone.createList('NoMatch', {
        fields: {
          name: { type: Text },
          meta: { type: Json },
        },
      });
      keystone.createList('WithMatch', {
        fields: {
          name: { type: Text },
          meta: {
            type: Json,
            enableMatchFilter: true,
            allowedMatchFilterPaths: [['a'], ['b', 'c']],
          },
        },
      });
      keystone.createList('StrictWrite', {
        fields: {
          name: { type: Text },
          meta: {
            type: Json,
            strictWriteValidation: true,
          },
        },
      });
      keystone.createList('NonStrictWrite', {
        fields: {
          name: { type: Text },
          meta: {
            type: Json,
            strictWriteValidation: false,
          },
        },
      });
    },
  });
}

multiAdapterRunners().map(({ runner, adapterName }) =>
  describe(`Adapter: ${adapterName}`, () => {
    describe('Json type options', () => {
      test(
        'enableMatchFilter: false (default) hides _match filter',
        runner(setupKeystone, async ({ keystone }) => {
          const {
            data: { __type },
            errors,
          } = await keystone.executeGraphQL({
            query: `
        query {
          __type(name: "NoMatchWhereInput") {
            inputFields {
              name
            }
          }
        }
      `,
          });
          expect(errors).toBe(undefined);
          const fieldNames = __type.inputFields.map(f => f.name);
          expect(fieldNames).toContain('meta');
          expect(fieldNames).toContain('meta_not');
          expect(fieldNames).toContain('meta_in');
          expect(fieldNames).toContain('meta_not_in');
          expect(fieldNames).not.toContain('meta_match');
        })
      );

      test(
        'enableMatchFilter: true shows _match filter',
        runner(setupKeystone, async ({ keystone }) => {
          const {
            data: { __type },
            errors,
          } = await keystone.executeGraphQL({
            query: `
        query {
          __type(name: "WithMatchWhereInput") {
            inputFields {
              name
            }
          }
        }
      `,
          });
          expect(errors).toBe(undefined);
          const fieldNames = __type.inputFields.map(f => f.name);
          expect(fieldNames).toContain('meta_match');
        })
      );

      test(
        'allowedMatchFilterPaths allows listed paths',
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await keystone.executeGraphQL({
            query: `
        query {
          allWithMatches(where: { meta_match: { path: ["a"], exists: true } }) {
            id
          }
        }
      `,
          });
          expect(errors).toBe(undefined);
          expect(data.allWithMatches).toEqual([]);
        })
      );

      test(
        'allowedMatchFilterPaths forbids unlisted paths',
        runner(setupKeystone, async ({ keystone }) => {
          const { errors } = await keystone.executeGraphQL({
            query: `
        query {
          allWithMatches(where: { meta_match: { path: ["unknown"], exists: true } }) {
            id
          }
        }
      `,
          });
          expect(errors).not.toBe(undefined);
          expect(errors[0].message).toContain('JSON path ["unknown"] is not allowed');
        })
      );

      test(
        'strictWriteValidation: true forbids unsafe keys',
        runner(setupKeystone, async ({ keystone }) => {
          const { errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          createStrictWrite(data: { meta: $meta }) {
            id
          }
        }
      `,
            variables: { meta: { constructor: 1 } },
          });
          expect(errors).not.toBe(undefined);
          expect(errors[0].message).toContain('Invalid JSON object key "constructor"');
        })
      );

      test(
        'strictWriteValidation: true allows safe JSON',
        runner(setupKeystone, async ({ keystone }) => {
          const meta = { a: 1, b: { c: 2 } };
          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          createStrictWrite(data: { meta: $meta }) {
            meta
          }
        }
      `,
            variables: { meta },
          });
          expect(errors).toBe(undefined);
          expect(data.createStrictWrite.meta).toEqual(meta);
        })
      );

      test(
        'strictWriteValidation: false (default) allows unsafe keys',
        runner(setupKeystone, async ({ keystone }) => {
          const meta = { constructor: 1 };
          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          createNonStrictWrite(data: { meta: $meta }) {
            meta
          }
        }
      `,
            variables: { meta },
          });
          expect(errors).toBe(undefined);
          expect(data.createNonStrictWrite.meta).toEqual(meta);
        })
      );

      test(
        'update with JSON field validates new value',
        runner(setupKeystone, async ({ keystone }) => {
          const item = await createItem({
            keystone,
            listKey: 'StrictWrite',
            item: { meta: { a: 1 } },
          });
          const { errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          updateStrictWrite(id: "${item.id}", data: { meta: $meta }) {
            id
          }
        }
      `,
            variables: { meta: { constructor: 1 } },
          });
          expect(errors).not.toBe(undefined);
          expect(errors[0].message).toContain('Invalid JSON object key "constructor"');
        })
      );

      test(
        'update with nested JSON field validates new value',
        runner(setupKeystone, async ({ keystone }) => {
          const item = await createItem({
            keystone,
            listKey: 'StrictWrite',
            item: { meta: { a: 1 } },
          });
          const { errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          updateStrictWrite(id: "${item.id}", data: { meta: $meta }) {
            id
          }
        }
      `,
            variables: { meta: { a: { constructor: 1 } } },
          });
          expect(errors).not.toBe(undefined);
          expect(errors[0].message).toContain('Invalid JSON object key "constructor"');
        })
      );

      test(
        'update with JSON field allows safe new value',
        runner(setupKeystone, async ({ keystone }) => {
          const item = await createItem({
            keystone,
            listKey: 'StrictWrite',
            item: { meta: { a: 1 } },
          });
          const meta = { b: 2 };
          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          updateStrictWrite(id: "${item.id}", data: { meta: $meta }) {
            meta
          }
        }
      `,
            variables: { meta },
          });
          expect(errors).toBe(undefined);
          expect(data.updateStrictWrite.meta).toEqual(meta);
        })
      );

      test(
        'update in NonStrictWrite allows unsafe keys',
        runner(setupKeystone, async ({ keystone }) => {
          const item = await createItem({
            keystone,
            listKey: 'NonStrictWrite',
            item: { meta: { a: 1 } },
          });
          const meta = { constructor: 1 };
          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation($meta: JSON) {
          updateNonStrictWrite(id: "${item.id}", data: { meta: $meta }) {
            meta
          }
        }
      `,
            variables: { meta },
          });
          expect(errors).toBe(undefined);
          expect(data.updateNonStrictWrite.meta).toEqual(meta);
        })
      );

      test(
        'update without JSON field does not validate existing legacy value',
        runner(setupKeystone, async ({ keystone }) => {
          // Bypassing GraphQL to create "bad" data in a list that expects "good" data.
          // In Keystone 5, direct adapter calls bypass resolveInput hooks.
          const listAdapter = keystone.lists['StrictWrite'].adapter;
          const item = await listAdapter.create({ meta: { constructor: 1 }, name: 'Legacy Item' });

          // Now we update 'name' via GraphQL. It should NOT trigger validation of 'meta'.
          const { data, errors } = await keystone.executeGraphQL({
            query: `
        mutation {
          updateStrictWrite(id: "${item.id}", data: { name: "Updated Name" }) {
            name
            meta
          }
        }
      `,
          });

          expect(errors).toBe(undefined);
          expect(data.updateStrictWrite.name).toEqual('Updated Name');
          expect(data.updateStrictWrite.meta).toEqual({ constructor: 1 });
        })
      );
    });
  })
);
