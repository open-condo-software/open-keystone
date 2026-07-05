const { multiAdapterRunners, setupServer } = require('@open-keystone/test-utils');
const { Text, Integer, Relationship } = require('@open-keystone/fields');
const { createItem } = require('@open-keystone/server-side-graphql-client');

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
          OR: [{ AND: [{ name: 'Alice' }] }, { AND: [{ name: 'Bob' }, { age: 30 }] }],
        },
      ],
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
  },
  {
    id: 'and_multiple_conditions_same_field',
    case: 'AND with multiple conditions on the same field',
    where: { AND: [{ age_gt: 25 }, { age_lt: 45 }] },
    expect_ids: ['Bob', 'Charlie'],
  },
  {
    id: 'or_nested_inside_or',
    case: 'OR nested inside OR',
    where: { OR: [{ name: 'Alice' }, { OR: [{ name: 'Bob' }, { name: 'Charlie' }] }] },
    expect_ids: ['Alice', 'Bob', 'Charlie'],
  },
  {
    id: 'and_with_empty_object',
    case: 'AND with empty object',
    where: { AND: [{}] },
    expect_ids: ['Alice', 'Bob', 'Charlie', 'David'],
  },
  {
    id: 'or_with_empty_object',
    case: 'OR with empty object',
    where: { OR: [{}] },
    expect_ids: ['Alice', 'Bob', 'Charlie', 'David'],
  },
  {
    id: 'or_with_null_relationship',
    case: 'OR with null relationship filter',
    where: { OR: [{ company_is_null: true }, { name: 'Alice' }] },
    expect_ids: ['Alice', 'David'],
  },
];

const extraComplexFilterTests = [
  {
    id: 'root_and_or_scalar_same_level',
    case: 'Scalar, AND and OR on the same root level should be implicit AND',
    where: {
      name_contains: 'i',
      AND: [{ age_gt: 25 }],
      OR: [{ company_is_null: true }, { email_contains: 'other' }],
    },
    expect_ids: ['Charlie', 'David'],
  },
  {
    id: 'root_and_or_scalar_same_level2',
    case: 'Scalar, AND and OR on the same root level should all be combined as implicit AND',
    where: {
      name_contains: 'i',
      AND: [{ age_gt: 25 }],
      OR: [{ company_is_null: true }],
    },
    expect_ids: ['David'],
  },
  {
    id: 'root_and_empty_with_scalar',
    case: 'Empty AND on root should be neutral',
    where: { name_contains: 'i', AND: [] },
    expect_ids: ['Alice', 'Charlie', 'David'],
  },
  {
    id: 'root_or_empty_with_scalar',
    case: 'Empty OR on root should make the whole filter false',
    where: { name_contains: 'i', OR: [] },
    expect_ids: [],
  },
  {
    id: 'and_with_nested_empty_or',
    case: 'AND containing empty OR should match nothing',
    where: { AND: [{ OR: [] }] },
    expect_ids: [],
  },
  {
    id: 'or_with_nested_empty_and',
    case: 'OR containing empty AND should match everything',
    where: { OR: [{ AND: [] }] },
    expect_ids: ['Alice', 'Bob', 'Charlie', 'David'],
  },
  {
    id: 'implicit_and_same_field_multiple_number_ops',
    case: 'Multiple operators for same scalar field should be implicit AND',
    where: { age_gt: 20, age_lt: 50 },
    expect_ids: ['Bob', 'Charlie'],
  },
  {
    id: 'or_with_implicit_and_same_field_multiple_number_ops',
    case: 'Implicit AND inside OR branch with multiple operators on same field',
    where: { OR: [{ age_gt: 20, age_lt: 50 }, { company_is_null: true }] },
    expect_ids: ['Bob', 'Charlie', 'David'],
  },
  {
    id: 'or_with_company_null_or_company_name',
    case: 'OR with null relationship branch and nested relationship branch',
    where: { OR: [{ company_is_null: true }, { company: { name: 'Cete' } }] },
    expect_ids: ['Charlie', 'David'],
  },
  {
    id: 'company_nested_or',
    case: 'Nested OR inside to-one relationship filter',
    where: { company: { OR: [{ name: 'Thinkmill' }, { name: 'Cete' }] } },
    expect_ids: ['Alice', 'Bob', 'Charlie'],
  },
  {
    id: 'company_scalar_and_or_same_level',
    case: 'Scalar and OR on same level inside to-one relationship should be implicit AND',
    where: { company: { name: 'Thinkmill', OR: [{ name: 'Cete' }] } },
    expect_ids: [],
  },
  {
    id: 'posts_some_same_related_item_impossible',
    case: 'posts_some with AND should require one same post to satisfy all conditions',
    where: { posts_some: { AND: [{ content: 'Hello' }, { content: 'World' }] } },
    expect_ids: [],
  },
  {
    id: 'posts_some_different_related_items_via_multiple_some',
    case: 'Multiple posts_some filters may match different posts',
    where: {
      AND: [{ posts_some: { content: 'Hello' } }, { posts_some: { content: 'World' } }],
    },
    expect_ids: ['Alice'],
  },
  {
    id: 'posts_some_or_same_related_item',
    case: 'posts_some with OR should match one related post satisfying any branch',
    where: { posts_some: { OR: [{ content: 'World' }, { content: 'Bye' }] } },
    expect_ids: ['Alice', 'Charlie'],
  },
  {
    id: 'posts_none_hello',
    case: 'posts_none should match users with no matching posts, including users with no posts',
    where: { posts_none: { content: 'Hello' } },
    expect_ids: ['Charlie', 'David'],
  },
  {
    id: 'posts_every_hello_vacuous_empty',
    case: 'posts_every should be true for empty relationship',
    where: { posts_every: { content: 'Hello' } },
    expect_ids: ['Bob', 'David'],
  },
  {
    id: 'posts_every_plus_some_requires_non_empty',
    case: 'posts_every + posts_some should require non-empty relationship',
    where: {
      AND: [{ posts_every: { content: 'Hello' } }, { posts_some: { content: 'Hello' } }],
    },
    expect_ids: ['Bob'],
  },
  {
    id: 'or_relationship_branches_should_not_duplicate_user',
    case: 'OR branches should not duplicate user if both branches match',
    where: {
      OR: [{ posts_some: { content: 'Hello' } }, { posts_some: { content: 'World' } }],
    },
    expect_ids: ['Alice', 'Bob'],
  },
  {
    id: 'or_branch_scalar_and_relationship_implicit_and',
    case: 'Scalar and relationship inside OR branch should be implicit AND',
    where: {
      OR: [{ name: 'Alice', posts_some: { content: 'Bye' } }, { name: 'Bob' }],
    },
    expect_ids: ['Bob'],
  },
];

const moreAndOrFilterTests = [
  {
    id: 'and_of_two_or_groups',
    case: 'AND of two OR groups should preserve grouping',
    where: {
      AND: [
        { OR: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }] },
        { OR: [{ age: 20 }, { age: 40 }] },
      ],
    },
    expect_ids: ['Alice', 'Charlie'],
  },
  {
    id: 'or_of_two_and_groups_negative_branches',
    case: 'OR of AND groups should not leak partially matched branches',
    where: {
      OR: [
        { AND: [{ name: 'Alice' }, { age: 30 }] },
        { AND: [{ name: 'Bob' }, { age: 20 }] },
        { AND: [{ name: 'Charlie' }, { age: 40 }] },
      ],
    },
    expect_ids: ['Charlie'],
  },
  {
    id: 'and_nested_inside_and',
    case: 'Nested AND inside AND should be equivalent to flattened AND',
    where: {
      AND: [
        { name_contains: 'i' },
        { AND: [{ age_gt: 25 }, { age_lt: 50 }] },
      ],
    },
    expect_ids: ['Charlie'],
  },
  {
    id: 'or_inside_and_branch_with_scalar_same_level',
    case: 'OR inside AND branch with scalar on same level should be implicit AND',
    where: {
      AND: [
        {
          name_contains: 'i',
          OR: [{ age: 20 }, { age: 50 }],
        },
      ],
    },
    expect_ids: ['Alice', 'David'],
  },
  {
    id: 'and_inside_or_branch_with_scalar_same_level',
    case: 'AND inside OR branch with scalar on same level should be implicit AND',
    where: {
      OR: [
        {
          name_contains: 'i',
          AND: [{ age_gt: 25 }],
        },
        { name: 'Bob' },
      ],
    },
    expect_ids: ['Bob', 'Charlie', 'David'],
  },
  {
    id: 'and_with_empty_object_and_scalar',
    case: 'Empty object inside AND should be neutral when mixed with real condition',
    where: {
      AND: [{}, { name: 'Alice' }],
    },
    expect_ids: ['Alice'],
  },
  {
    id: 'or_with_empty_object_and_scalar',
    case: 'Empty object inside OR should make OR match everything',
    where: {
      OR: [{}, { name: 'Alice' }],
    },
    expect_ids: ['Alice', 'Bob', 'Charlie', 'David'],
  },
  {
    id: 'and_with_empty_or_and_scalar',
    case: 'Empty OR inside AND should make whole AND false',
    where: {
      AND: [{ OR: [] }, { name: 'Alice' }],
    },
    expect_ids: [],
  },
  {
    id: 'or_with_empty_and_and_false_scalar',
    case: 'Empty AND inside OR should make whole OR true',
    where: {
      OR: [{ AND: [] }, { name: 'Nobody' }],
    },
    expect_ids: ['Alice', 'Bob', 'Charlie', 'David'],
  },
  {
    id: 'posts_some_scalar_and_or_same_level_impossible',
    case: 'posts_some with scalar and OR on same related item should not match different posts',
    where: {
      posts_some: {
        content_contains: 'H',
        OR: [{ content: 'World' }],
      },
    },
    expect_ids: [],
  },
  {
    id: 'posts_some_scalar_and_or_same_level_positive',
    case: 'posts_some with scalar and OR on same related item should match same post',
    where: {
      posts_some: {
        content_contains: 'H',
        OR: [{ content_contains: 'e' }, { content: 'World' }],
      },
    },
    expect_ids: ['Alice', 'Bob'],
  },
  {
    id: 'posts_none_with_or',
    case: 'posts_none with OR should exclude users having any post matching any OR branch',
    where: {
      posts_none: {
        OR: [{ content: 'Hello' }, { content: 'World' }],
      },
    },
    expect_ids: ['Charlie', 'David'],
  },
  {
    id: 'posts_none_with_and_impossible',
    case: 'posts_none with impossible AND should match everyone',
    where: {
      posts_none: {
        AND: [{ content: 'Hello' }, { content: 'World' }],
      },
    },
    expect_ids: ['Alice', 'Bob', 'Charlie', 'David'],
  },
  {
    id: 'posts_every_with_and',
    case: 'posts_every with AND should require every related post to satisfy both conditions',
    where: {
      posts_every: {
        AND: [{ content_contains: 'l' }, { content_contains: 'o' }],
      },
    },
    expect_ids: ['Alice', 'Bob', 'David'],
  },
  {
    id: 'posts_every_with_empty_or',
    case: 'posts_every with empty OR should only match users with no posts',
    where: {
      posts_every: {
        OR: [],
      },
    },
    expect_ids: ['David'],
  },

  {
    id: 'posts_some_with_empty_and',
    case: 'posts_some with empty AND should match users having at least one post',
    where: {
      posts_some: {
        AND: [],
      },
    },
    expect_ids: ['Alice', 'Bob', 'Charlie'],
  },

  {
    id: 'posts_some_with_empty_or',
    case: 'posts_some with empty OR should match nobody',
    where: {
      posts_some: {
        OR: [],
      },
    },
    expect_ids: [],
  },
];

const invalidFilterTests = [
  {
    id: 'unknown_filter_field',
    case: 'Unknown filter field',
    where: { age_between: [20, 30] },
    expected_error:
      'Variable "$where" got invalid value { age_between: [20, 30] }; Field "age_between" is not defined by type "UserWhereInput".',
  },
  {
    id: 'wrong_scalar_type',
    case: 'Wrong scalar type',
    where: { age_gt: '25' },
    expected_error:
      'Variable "$where" got invalid value "25" at "where.age_gt"; Int cannot represent non-integer value: "25"',
  },
  {
    id: 'wrong_and_type',
    case: 'Wrong AND type',
    where: { AND: 123 },
    expected_error:
      'Variable "$where" got invalid value 123 at "where.AND"; Expected type "UserWhereInput" to be an object.',
  },
  {
    id: 'null_inside_and_array',
    case: 'Null inside AND array',
    where: { AND: [null] },
    expected_error:
      'Variable "$where" got invalid value null at "where.AND[0]"; Expected non-nullable type "UserWhereInput!" not to be null.',
  },
  {
    id: 'unknown_logical_operator',
    case: 'Unknown logical operator',
    where: { NOT: [{ name: 'Alice' }] },
    expected_error:
      'Variable "$where" got invalid value { NOT: [[Object]] }; Field "NOT" is not defined by type "UserWhereInput".',
  },
  {
    id: 'wrong_or_type',
    case: 'Wrong OR type',
    where: { OR: 123 },
    expected_error:
      'Variable "$where" got invalid value 123 at "where.OR"; Expected type "UserWhereInput" to be an object.',
  },
  {
    id: 'null_inside_or_array',
    case: 'Null inside OR array',
    where: { OR: [null] },
    expected_error:
      'Variable "$where" got invalid value null at "where.OR[0]"; Expected non-nullable type "UserWhereInput!" not to be null.',
  },
];

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

multiAdapterRunners().map(({ runner, adapterName }) =>
  describe(`Adapter: ${adapterName}`, () => {
    describe('Complex AND/OR filters', () => {
      const cases = [...complexFilterTests, ...extraComplexFilterTests, ...moreAndOrFilterTests];
      cases.forEach(({ id, case: title, where, expect_ids, ...expected }) => {
        test(
          `Valid: ${id} : ${title}`,
          runner(setupKeystone, async ({ keystone }) => {
            await createFixture(keystone);
            const { data, errors } = await keystone.executeGraphQL({
              query: `query($where: UserWhereInput) { allUsers(where: $where) { name } }`,
              variables: { where },
            });
            expect(errors).toBeUndefined();
            const ids = data.allUsers.map(u => u.name).sort();
            const result = (adapterName in expected ? expected[adapterName] : expect_ids).sort();
            expect(ids).toEqual(result);
          })
        );
      });

      invalidFilterTests.forEach(({ id, case: title, where, expected_error, ...expected }) => {
        test(
          `Invalid: ${id} : ${title}`,
          runner(setupKeystone, async ({ keystone }) => {
            await createFixture(keystone);
            const { data, errors } = await keystone.executeGraphQL({
              query: `query($where: UserWhereInput) { allUsers(where: $where) { name } }`,
              variables: { where },
            });
            expect(errors).not.toBe(undefined);
            const expectedMessage = expected[adapterName] || expected_error;
            expect(errors[0].message).toEqual(expect.stringContaining(expectedMessage));
            expect(data).toBeUndefined();
          })
        );
      });
    });
  })
);
