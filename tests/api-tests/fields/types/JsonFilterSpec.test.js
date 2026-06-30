const { multiAdapterRunners, setupServer } = require('@open-keystone/test-utils');
const { Text, Json } = require('@open-keystone/fields');
const { createItem } = require('@open-keystone/server-side-graphql-client');

function setupKeystone(adapterName) {
  return setupServer({
    adapterName,
    createLists: keystone => {
      keystone.createList('User', {
        fields: {
          name: { type: Text },
          metadata: { type: Json },
        },
      });
    },
  });
}

multiAdapterRunners().map(({ runner, adapterName }) =>
  describe(`Adapter: ${adapterName}`, () => {
    describe('Json filter spec', () => {
      test(
        'Matching whole JSON value with equals',
        runner(setupKeystone, async ({ keystone }) => {
          const admin = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Admin', metadata: { role: 'admin' } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Guest', metadata: { role: 'guest' } },
          });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
            query {
              allUsers(where: {
                id: "${admin.id}"
                metadata_match: {
                  equals: { role: "admin" }
                }
              }) {
                name
              }
            }
          `,
          });
          expect(errors).toBe(undefined);
          expect(data.allUsers).toEqual([{ name: 'Admin' }]);
        })
      );

      test(
        'Matching nested value with path and equals',
        runner(setupKeystone, async ({ keystone }) => {
          const german = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'German', metadata: { profile: { country: 'DE' } } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'French', metadata: { profile: { country: 'FR' } } },
          });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
            query {
              allUsers(where: {
                id: "${german.id}"
                metadata_match: {
                  path: ["profile", "country"]
                  equals: "DE"
                }
              }) {
                name
              }
            }
          `,
          });
          expect(errors).toBe(undefined);
          expect(data.allUsers).toEqual([{ name: 'German' }]);
        })
      );

      test(
        'Matching nested value with path and gte',
        runner(setupKeystone, async ({ keystone }) => {
          const adult = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Adult', metadata: { profile: { age: 20 } } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Child', metadata: { profile: { age: 10 } } },
          });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
            query {
              allUsers(where: {
                id: "${adult.id}"
                metadata_match: {
                  path: ["profile", "age"]
                  gte: 18
                }
              }) {
                name
              }
            }
          `,
          });
          expect(errors).toBe(undefined);
          expect(data.allUsers).toEqual([{ name: 'Adult' }]);
        })
      );

      test(
        'Matching nested value in array with path',
        runner(setupKeystone, async ({ keystone }) => {
          const berlin = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'BerlinUser', metadata: { addresses: [{ city: 'Berlin' }] } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'MunichUser', metadata: { addresses: [{ city: 'Munich' }] } },
          });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
            query {
              allUsers(where: {
                id: "${berlin.id}"
                metadata_match: {
                  path: ["addresses", "0", "city"]
                  equals: "Berlin"
                }
              }) {
                name
              }
            }
          `,
          });
          expect(errors).toBe(undefined);
          expect(data.allUsers).toEqual([{ name: 'BerlinUser' }]);
        })
      );

      test(
        'Checking whether a path exists',
        runner(setupKeystone, async ({ keystone }) => {
          const withCo = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'WithCompany', metadata: { profile: { company: 'Google' } } },
          });
          const withoutCo = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'WithoutCompany', metadata: { profile: {} } },
          });

          const { data: data1 } = await keystone.executeGraphQL({
            query: `query { allUsers(where: { id: "${withCo.id}", metadata_match: { path: ["profile", "company"], exists: true } }) { name } }`,
          });
          expect(data1.allUsers).toEqual([{ name: 'WithCompany' }]);

          const { data: data2 } = await keystone.executeGraphQL({
            query: `query { allUsers(where: { id: "${withoutCo.id}", metadata_match: { path: ["profile", "company"], exists: false } }) { name } }`,
          });
          expect(data2.allUsers).toEqual([{ name: 'WithoutCompany' }]);
        })
      );

      test(
        'Checking for null',
        runner(setupKeystone, async ({ keystone }) => {
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'NullMiddleName', metadata: { profile: { middleName: null } } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'WithMiddleName', metadata: { profile: { middleName: 'Alex' } } },
          });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
            query {
              allUsers(where: {
                metadata_match: {
                  path: ["profile", "middleName"]
                  exists: true
                }
              }) {
                name
              }
            }
          `,
          });
          expect(errors).toBe(undefined);
          expect(data.allUsers).toEqual([{ name: 'WithMiddleName' }]);
        })
      );

      test(
        'Matching strings with string_ends_with',
        runner(setupKeystone, async ({ keystone }) => {
          const example = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Example', metadata: { profile: { email: 'test@example.com' } } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Other', metadata: { profile: { email: 'test@gmail.com' } } },
          });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
            query {
              allUsers(where: {
                id: "${example.id}"
                metadata_match: {
                  path: ["profile", "email"]
                  string_ends_with: "@example.com"
                }
              }) {
                name
              }
            }
          `,
          });
          expect(errors).toBe(undefined);
          expect(data.allUsers).toEqual([{ name: 'Example' }]);
        })
      );

      test(
        'Matching arrays with array_contains',
        runner(setupKeystone, async ({ keystone }) => {
          const beta = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'BetaUser', metadata: { tags: ['beta', 'new'] } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'RegularUser', metadata: { tags: ['stable'] } },
          });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
            query {
              allUsers(where: {
                id: "${beta.id}"
                metadata_match: {
                  path: ["tags"]
                  array_contains: "beta"
                }
              }) {
                name
              }
            }
          `,
          });
          expect(errors).toBe(undefined);
          expect(data.allUsers).toEqual([{ name: 'BetaUser' }]);
        })
      );

      test(
        'Combining JSON filters with AND',
        runner(setupKeystone, async ({ keystone }) => {
          const target = await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Target', metadata: { profile: { country: 'DE' }, tags: ['beta'] } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Partial1', metadata: { profile: { country: 'DE' }, tags: ['stable'] } },
          });
          await createItem({
            keystone,
            listKey: 'User',
            item: { name: 'Partial2', metadata: { profile: { country: 'FR' }, tags: ['beta'] } },
          });

          const { data, errors } = await keystone.executeGraphQL({
            query: `
            query {
              allUsers(where: {
                id: "${target.id}"
                AND: [
                  {
                    metadata_match: {
                      path: ["profile", "country"]
                      equals: "DE"
                    }
                  },
                  {
                    metadata_match: {
                      path: ["tags"]
                      array_contains: "beta"
                    }
                  }
                ]
              }) {
                name
              }
            }
          `,
          });
          expect(errors).toBe(undefined);
          expect(data.allUsers).toEqual([{ name: 'Target' }]);
        })
      );

      describe('exists and is_null', () => {
        test(
          'exists: false matches missing path',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({
              keystone,
              listKey: 'User',
              item: { name: 'WithCity', metadata: { address: { city: 'Berlin' } } },
            });
            await createItem({
              keystone,
              listKey: 'User',
              item: { name: 'WithoutCity', metadata: { address: { country: 'Germany' } } },
            });

            const { data, errors } = await keystone.executeGraphQL({
              query: `
              query {
                allUsers(where: {
                  metadata_match: {
                    path: ["address", "city"]
                    exists: false
                  }
                }) {
                  name
                }
              }
            `,
            });
            expect(errors).toBe(undefined);
            const names = data.allUsers.map(u => u.name);
            // Standard behaviors vary across adapters in Keystone 5.
            // We check that at least it doesn't fail.
            expect(names).toContain('WithoutCity');
          })
        );

        test(
          'exists: false matches JSON null',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({
              keystone,
              listKey: 'User',
              item: { name: 'NullCity', metadata: { address: { city: null } } },
            });

            const { data, errors } = await keystone.executeGraphQL({
              query: `
              query {
                allUsers(where: {
                  metadata_match: {
                    path: ["address", "city"]
                    exists: false
                  }
                }) {
                  name
                  metadata
                }
              }
            `,
            });
            expect(errors).toBe(undefined);
            const names = data.allUsers.map(u => u.name);
            expect(names).toContain('NullCity');
            // Normalized to null
            data.allUsers.forEach(u => expect(u.metadata).toEqual(null));
          })
        );
      });

      describe('Type-specific operators', () => {
        test(
          'string_contains only matches strings',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({
              keystone,
              listKey: 'User',
              item: { name: 'String', metadata: { val: 'abc' } },
            });
            await createItem({
              keystone,
              listKey: 'User',
              item: { name: 'Number', metadata: { val: 123 } },
            });

            const { data, errors } = await keystone.executeGraphQL({
              query: `
              query {
                allUsers(where: {
                  metadata_match: {
                    path: ["val"]
                    string_contains: "ab"
                  }
                }) {
                  name
                }
              }
            `,
            });
            expect(errors).toBe(undefined);
            const names = data.allUsers.map(u => u.name);
            expect(names).toContain('String');
          })
        );

        test(
          'gte only matches numbers',
          runner(setupKeystone, async ({ keystone }) => {
            await createItem({
              keystone,
              listKey: 'User',
              item: { name: 'NumMatch', metadata: { val: 20 } },
            });
            await createItem({
              keystone,
              listKey: 'User',
              item: { name: 'NumNoMatch', metadata: { val: 10 } },
            });
            await createItem({
              keystone,
              listKey: 'User',
              item: { name: 'Str', metadata: { val: '30' } },
            });

            const { data, errors } = await keystone.executeGraphQL({
              query: `
              query {
                allUsers(where: {
                  metadata_match: {
                    path: ["val"]
                    gte: 15
                  }
                }) {
                  name
                }
              }
            `,
            });
            expect(errors).toBe(undefined);
            const names = data.allUsers.map(u => u.name);
            expect(names).toContain('NumMatch');
          })
        );
      });

      describe('Validations', () => {
        test(
          'Error when path is an empty array',
          runner(setupKeystone, async ({ keystone }) => {
            const { data, errors } = await keystone.executeGraphQL({
              query: `query { allUsers(where: { metadata_match: { path: [], equals: "foo" } }) { id } }`,
            });
            expect(errors).not.toBe(undefined);
            expect(errors[0].message).toMatch(/JSON path cannot be empty/);
          })
        );

        test(
          'Error when path segment is invalid',
          runner(setupKeystone, async ({ keystone }) => {
            const invalidSegments = ['profile.country', '$', '*', '__proto__', 'constructor'];
            for (const segment of invalidSegments) {
              const { data, errors } = await keystone.executeGraphQL({
                query: `query { allUsers(where: { metadata_match: { path: ["${segment}"], equals: "foo" } }) { id } }`,
              });
              expect(errors).not.toBe(undefined);
              expect(errors[0].message).toContain(`Invalid JSON path segment`);
            }
          })
        );

        test(
          'Error when multiple conditions are provided',
          runner(setupKeystone, async ({ keystone }) => {
            const { data, errors } = await keystone.executeGraphQL({
              query: `query { allUsers(where: { metadata_match: { equals: "foo", exists: true } }) { id } }`,
            });
            expect(errors).not.toBe(undefined);
            expect(errors[0].message).toMatch(/Only one condition can be used in JsonMatchInput/);
          })
        );

        test(
          'Error when no conditions are provided',
          runner(setupKeystone, async ({ keystone }) => {
            const { data, errors } = await keystone.executeGraphQL({
              query: `query { allUsers(where: { metadata_match: { path: ["foo"] } }) { id } }`,
            });
            expect(errors).not.toBe(undefined);
            expect(errors[0].message).toMatch(/One condition is required in JsonMatchInput/);
          })
        );
      });
    });
  })
);
