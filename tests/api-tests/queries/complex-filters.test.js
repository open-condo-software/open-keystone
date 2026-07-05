const { multiAdapterRunners, setupServer } = require('@open-keystone/test-utils');
const { Text, Integer, Relationship } = require('@open-keystone/fields');
const { createItem } = require('@open-keystone/server-side-graphql-client');

const setupKeystone = adapterName =>
  setupServer({
    adapterName,
    createLists: keystone => {
      keystone.createList('User', {
        fields: {
          name: { type: Text },
          email: { type: Text },
          age: { type: Integer },
          company: { type: Relationship, ref: 'Company' },
          posts: { type: Relationship, ref: 'Post', many: true },
        },
      });
      keystone.createList('Company', {
        fields: {
          name: { type: Text },
        },
      });
      keystone.createList('Post', {
        fields: {
          content: { type: Text },
        },
      });
    },
  });

const complexFilterTests = [
  {
    id: 'and_with_scalar_on_same_level',
    case: 'Scalar field and AND on the same level (implicit AND)',
    where: { name_contains: 'i', AND: [{ age_gt: 25 }] },
    expect_ids: ['Charlie', 'David'],
  },
  {
    id: 'or_with_scalar_on_same_level',
    case: 'Scalar field and OR on the same level (implicit AND)',
    where: { name: 'Alice', OR: [{ age: 30 }, { age: 20 }] },
    expect_ids: ['Alice'],
  },
  {
    id: 'and_with_multiple_scalars_implicit',
    case: 'Multiple scalar fields inside AND (implicit AND)',
    where: { AND: [{ name_contains: 'a', age_gt: 25 }] },
    expect_ids: ['Charlie', 'David'],
  },
  {
    id: 'or_with_multiple_scalars_implicit',
    case: 'Multiple scalar fields inside OR (implicit AND)',
    where: { OR: [{ name: 'Alice', age: 30 }, { name: 'Bob' }] },
    expect_ids: ['Bob'],
  },
  {
    id: 'nested_or_inside_and',
    case: 'Nested OR inside AND',
    where: { AND: [{ name_contains: 'a' }, { OR: [{ age: 20 }, { age: 50 }] }] },
    expect_ids: ['David'],
  },
  {
    id: 'nested_and_inside_or',
    case: 'Nested AND inside OR',
    where: { OR: [{ AND: [{ name_contains: 'i' }, { age: 20 }] }, { age: 40 }] },
    expect_ids: ['Alice', 'Charlie'],
  },
  {
    id: 'empty_and',
    case: 'Empty AND array',
    where: { AND: [] },
    expect_ids: ['Alice', 'Bob', 'Charlie', 'David'],
  },
  {
    id: 'empty_or',
    case: 'Empty OR array',
    where: { OR: [] },
    expect_ids: [],
  },
  {
    id: 'and_with_relationship_and_scalar',
    case: 'AND with relationship filter and scalar field',
    where: { AND: [{ company: { name: 'Thinkmill' } }, { age_lt: 25 }] },
    expect_ids: ['Alice'],
  },
  {
    id: 'posts_some_with_and',
    case: 'Relationship posts_some with AND (multiple conditions on SAME post)',
    where: { posts_some: { AND: [{ content_contains: 'H' }, { content_contains: 'l' }] } },
    expect_ids: ['Alice', 'Bob'],
  },
  {
    id: 'and_with_multiple_posts_some',
    case: 'AND with multiple posts_some (conditions on POTENTIALLY DIFFERENT posts)',
    where: { AND: [{ posts_some: { content: 'Hello' } }, { posts_some: { content: 'World' } }] },
    expect_ids: ['Alice'],
  },
  {
    id: 'posts_every_with_or',
    case: 'Relationship posts_every with OR',
    where: { posts_every: { OR: [{ content: 'Hello' }, { content: 'World' }] } },
    expect_ids: ['Alice', 'Bob', 'David'],
  },
  {
    id: 'or_with_same_field_repeated',
    case: 'OR with same field repeated with different conditions',
    where: { OR: [{ age_lt: 25 }, { age_gt: 45 }] },
    expect_ids: ['Alice', 'David'],
  },
  {
    id: 'deeply_nested_and_or',
    case: 'Deeply nested AND/OR',
    where: {
      AND: [
        {
          OR: [
            { AND: [{ name: 'Alice' }] },
            { AND: [{ name: 'Bob' }, { age: 30 }] }
          ]
        }
      ]
    },
    expect_ids: ['Alice', 'Bob'],
  },
  {
    id: 'and_with_mixed_fields_inside',
    case: 'Mixed fields and AND inside AND',
    where: { AND: [{ name_contains: 'a', AND: [{ age_gt: 25 }] }] },
    expect_ids: ['Charlie', 'David'],
  },
  {
    id: 'nested_relationship_mixed_and',
    case: 'Nested relationship with mixed fields and AND',
    where: { company: { name_contains: 'T', AND: [{ name_contains: 'i' }] } },
    expect_ids: ['Alice', 'Bob'],
  },
  {
    id: 'implicit_and_in_scalar_filter',
    case: 'Multiple fields in a single object (implicit AND)',
    where: { name: 'Alice', age: 30 },
    expect_ids: [],
  },
  {
    id: 'or_with_nested_and_scalar_mixed',
    case: 'OR with mixed nested AND and scalar fields',
    where: { OR: [{ AND: [{ name: 'Alice' }, { age: 30 }] }, { name: 'Bob' }] },
    expect_ids: ['Bob'],
  }
];

const invalidFilterTests = [
  {
    id: 'unknown_filter_field',
    where: { age_between: [20, 30] },
  },
  {
    id: 'wrong_scalar_type',
    where: { age_gt: '25' },
  },
  {
    id: 'wrong_and_shape',
    where: { AND: { age: 20 } },
  },
  {
    id: 'null_inside_and_array',
    where: { AND: [null] },
  },
  {
    id: 'unknown_logical_operator',
    where: { NOT: [{ name: 'Alice' }] },
  },
];

const createFixture = async keystone => {
  const companies = {};
  companies.c1 = await createItem({ keystone, listKey: 'Company', item: { name: 'Thinkmill' } });
  companies.c2 = await createItem({ keystone, listKey: 'Company', item: { name: 'Cete' } });

  const posts = {};
  posts.p1 = await createItem({ keystone, listKey: 'Post', item: { content: 'Hello' } });
  posts.p2 = await createItem({ keystone, listKey: 'Post', item: { content: 'World' } });
  posts.p3 = await createItem({ keystone, listKey: 'Post', item: { content: 'Bye' } });

  await createItem({
    keystone,
    listKey: 'User',
    item: {
      name: 'Alice',
      age: 20,
      email: 'alice@example.com',
      company: { connect: { id: companies.c1.id } },
      posts: { connect: [{ id: posts.p1.id }, { id: posts.p2.id }] },
    },
  });
  await createItem({
    keystone,
    listKey: 'User',
    item: {
      name: 'Bob',
      age: 30,
      email: 'bob@example.com',
      company: { connect: { id: companies.c1.id } },
      posts: { connect: [{ id: posts.p1.id }] },
    },
  });
  await createItem({
    keystone,
    listKey: 'User',
    item: {
      name: 'Charlie',
      age: 40,
      email: 'charlie@other.com',
      company: { connect: { id: companies.c2.id } },
      posts: { connect: [{ id: posts.p3.id }] },
    },
  });
  await createItem({
    keystone,
    listKey: 'User',
    item: {
      name: 'David',
      age: 50,
      email: 'david@example.com',
      company: null,
      posts: { connect: [] },
    },
  });
};

multiAdapterRunners().map(({ runner, adapterName }) =>
  describe(`Adapter: ${adapterName}`, () => {
    describe('Complex AND/OR filters', () => {
      const tests = [
        ...complexFilterTests,
        // ...invalidFilterTests,
      ];
      tests.forEach(({ id, case: title, where, expect_ids, ...expected }) => {
        test(
          `${id} : ${title}`,
          runner(setupKeystone, async ({ keystone }) => {
            await createFixture(keystone);
            const { data, errors } = await keystone.executeGraphQL({
              query: `query($where: UserWhereInput) { allUsers(where: $where) { name } }`,
              variables: { where },
            });
            expect(errors).toBe(undefined);
            const ids = data.allUsers.map(u => u.name).sort();
            const result = (
              adapterName in expected ? expected[adapterName] : expect_ids
            ).sort();
            expect(ids).toEqual(result);
          })
        );
      });
    });
  })
);
