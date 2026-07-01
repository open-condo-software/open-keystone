const { multiAdapterRunners, setupServer } = require('@open-keystone/test-utils');
const { Text, Json } = require('@open-keystone/fields');
const { createItem } = require('@open-keystone/server-side-graphql-client');

const optionalRootValueFixtureRecords = [
  { id: 'r1', metadata: {} },
  { id: 'r2', metadata: [] },
  { id: 'r3', metadata: 'root text' },
  { id: 'r4', metadata: 0 },
  { id: 'r5', metadata: false },
  { id: 'r6', metadata: ['beta', { code: 'root' }, null, []] },
  { id: 'r7', metadata: null },
];

const optionalRootValueFilterTests = [
  {
    id: 'json_match_root_001_equals_empty_object',
    case: 'root empty object equals',
    result: 'Only r1 has metadata equal to the root empty object.',
    where: { metadata_match: { equals: {} } },
    expect_ids: ['r1'],
  },
  {
    id: 'json_match_root_002_equals_empty_array',
    case: 'root empty array equals',
    result: 'Only r2 has metadata equal to the root empty array.',
    where: { metadata_match: { equals: [] } },
    expect_ids: ['r2'],
    mongoose: ['r2', 'r6'],
  },
  {
    id: 'json_match_root_003_string_contains_root_text',
    case: 'path omitted string filter on root string',
    result: 'Only r3 is a root string containing text.',
    where: { metadata_match: { string_contains: 'text' } },
    expect_ids: ['r3'],
  },
  {
    id: 'json_match_root_004_number_gte_zero',
    case: 'path omitted number filter on root number',
    result: 'Only r4 is a root JSON number greater than or equal to zero.',
    where: { metadata_match: { number_gte: 0 } },
    expect_ids: ['r4'],
  },
  {
    id: 'json_match_root_005_equals_false',
    case: 'path omitted equals false',
    result: 'Only r5 is root boolean false; this catches falsy operator handling.',
    where: { metadata_match: { equals: false } },
    expect_ids: ['r5'],
  },
  {
    id: 'json_match_root_006_array_contains_beta',
    case: 'path omitted array_contains on root array',
    result: 'Only r6 is a root array containing beta.',
    where: { metadata_match: { array_contains: 'beta' } },
    expect_ids: ['r6'],
  },
  {
    id: 'json_match_root_007_array_contains_empty_array',
    case: 'root array contains empty array element',
    result:
      'Only r6 contains [] as an element; r2 is itself an empty array but contains no elements.',
    where: { metadata_match: { array_contains: [] } },
    expect_ids: ['r6'],
  },
  {
    id: 'json_match_root_008_array_not_contains_beta',
    case: 'path omitted array_not_contains includes non-arrays and root null',
    result:
      'Everything except r6 matches: non-arrays, empty array without beta, and root null all satisfy the negative array operator.',
    where: { metadata_match: { array_not_contains: 'beta' } },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r7'],
    prisma_postgresql: ['r2'],
  },
];

const setupKeystone = adapterName =>
  setupServer({
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

async function createFixture(keystone) {
  for (const item of optionalRootValueFixtureRecords) {
    await createItem({
      keystone,
      listKey: 'User',
      item: { name: item.id, metadata: item.metadata },
    });
  }
}

const runQuery = async (keystone, where) => {
  const { data, errors } = await keystone.executeGraphQL({
    query: `query($where: UserWhereInput) { allUsers(where: $where) { name } }`,
    variables: { where },
  });
  if (errors) return { errors };
  return { ids: data.allUsers.map(u => u.name).sort() };
};

multiAdapterRunners().map(({ runner, adapterName }) =>
  describe(`Adapter: ${adapterName}`, () => {
    describe('JsonFilterOptionalRoot', () => {
      optionalRootValueFilterTests.forEach(
        ({ id, case: title, where, expect_ids, ...expected }) => {
          test(
            `${id} : ${title}`,
            runner(setupKeystone, async ({ keystone }) => {
              await createFixture(keystone);
              const { ids, errors } = await runQuery(keystone, where);
              expect(errors).toBe(undefined);
              const result = (adapterName in expected ? expected[adapterName] : expect_ids).sort();
              expect(ids.sort()).toEqual(result);
            })
          );
        }
      );
    });
  })
);
