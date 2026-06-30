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
          metadata: {
            type: Json,
            allowedPaths: [
              ['profile', 'country'],
              ['profile', 'age'],
              ['profile', 'email'],
              ['profile', 'name'],
              ['profile', 'middleName'],
              ['profile', 'active'],
              ['profile', 'company', 'tier'],
              ['tags'],
              ['tags', '0'],
              ['tags', '1'],
              ['tags', '3'],
              ['score'],
              ['addresses'],
              ['addresses', '0', 'city'],
              ['addresses', '1', 'city'],
              ['flags', 'emailVerified'],
              ['settings'],
              ['misc', 'emptyArray'],
              ['misc', 'emptyObject'],
              ['preferences', 'newsletter'],
            ],
          },
        },
      });
    },
  });
}

const fixture = [
  {
    id: 'u1',
    metadata: {
      profile: { country: 'DE', age: 29, email: 'alex@example.com', name: 'Alex', middleName: null, active: true },
      tags: ['beta', 'paid'],
      score: 10,
      addresses: [{ city: 'Berlin', zip: '10115' }],
      flags: { emailVerified: true },
    },
  },
  {
    id: 'u2',
    metadata: {
      profile: { country: 'DE', age: 17, email: 'bob@spam.test', name: 'bob', active: false },
      tags: ['free'],
      score: 0,
      addresses: [{ city: 'Munich' }],
      flags: { emailVerified: false },
    },
  },
  {
    id: 'u3',
    metadata: {
      profile: { country: 'FR', age: 35, email: 'clara@example.org', name: 'Clara', company: { tier: 'gold' } },
      tags: ['beta', 'internal'],
      score: 15,
      addresses: [],
    },
  },
  {
    id: 'u4',
    metadata: {
      profile: { age: 42, email: 'dora@example.com', name: 'Dora', middleName: null },
      tags: [],
      score: 20,
      settings: null,
    },
  },
  {
    id: 'u5',
    metadata: {
      profile: { country: null, age: 30, email: 'eve@example.com', name: 'Eve' },
      tags: ['beta', { code: 'x' }],
      score: '10',
      addresses: [{ city: null }],
      misc: { emptyArray: [], emptyObject: {} },
    },
  },
  {
    id: 'u6',
    metadata: {
      profile: { country: 'US', age: 65, email: 'root@example.com', name: 'Root' },
      tags: ['enterprise', 'paid'],
      score: 100,
      addresses: [{ city: 'New York' }, { city: 'Berlin' }],
    },
  },
  {
    id: 'u7',
    metadata: {
      profile: { country: 'DE', age: 29, email: 'anna@test.de', name: 'Anna' },
      tags: ['beta'],
      score: 10,
      addresses: [{ city: 'Hamburg' }],
      preferences: { newsletter: false },
    },
  },
  {
    id: 'u8',
    metadata: {
      profile: { country: 'DE', age: 0, email: 'zero@example.com', name: '' },
      tags: ['0', 0, false, null],
      score: -1,
      addresses: [{ city: '' }],
    },
  },
  {
    id: 'u9',
    metadata: null,
  },
];

async function createFixture(keystone) {
  for (const item of fixture) {
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
    describe('JsonFilterTrickySpec', () => {
      const testCases = [
        ...fixture.map(item => ({
          id: `json_match_validation_${item.id}`,
          title: `Validating normalization for ${item.id}`,
          where: { name: item.id },
          expect_ids: [item.id],
        })),
        {
          id: 'json_match_invalid_013_is_null_forbidden',
          title: 'is_null запрещен',
          where: { metadata_match: { path: ['profile', 'middleName'], is_null: true } },
          expect_error: { message_contains: 'is not defined' },
        },
        {
          id: 'json_match_invalid_014_equals_null_forbidden',
          title: 'equals: null запрещен',
          where: { metadata_match: { path: ['profile', 'middleName'], equals: null } },
          expect_error: { message_contains: 'treated as deleted values' },
        },
        {
          id: 'json_match_invalid_015_equals_empty_object_forbidden',
          title: 'equals: {} запрещен',
          where: { metadata_match: { path: ['misc', 'emptyObject'], equals: {} } },
          expect_error: { message_contains: 'treated as deleted values' },
        },
        {
          id: 'json_match_invalid_016_equals_empty_array_forbidden',
          title: 'equals: [] запрещен',
          where: { metadata_match: { path: ['misc', 'emptyArray'], equals: [] } },
          expect_error: { message_contains: 'treated as deleted values' },
        },
        {
          id: 'json_match_invalid_017_in_null_forbidden',
          title: 'in: [null] запрещен',
          where: { metadata_match: { path: ['profile', 'middleName'], in: [null] } },
          expect_error: { message_contains: 'null' },
        },
        {
          id: 'json_match_invalid_018_array_contains_null_forbidden',
          title: 'array_contains: null запрещен',
          where: { metadata_match: { path: ['tags'], array_contains: null } },
          expect_error: { message_contains: 'treated as deleted values' },
        },
        {
          id: 'json_match_001_equals_scalar',
          title: 'equals по вложенному scalar значению',
          where: { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
          expect_ids: ['u1', 'u2', 'u7', 'u8'],
        },
        {
          id: 'json_match_003_not_scalar_explicit_negation',
          title: 'Имитация global NOT через JsonMatchInput.not',
          where: { metadata_match: { path: ['profile', 'country'], not: 'DE' } },
          expect_ids: ['u3', 'u4', 'u5', 'u6', 'u9'],
        },
        {
          id: 'json_match_005_exists_false_missing_and_deleted',
          title: 'exists false ищет отсутствующий путь и "удаленные" значения (null, {}, [])',
          where: { metadata_match: { path: ['profile', 'middleName'], exists: false } },
          expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'],
        },
        {
          id: 'json_match_006_and_country_and_age',
          title: 'AND: страна DE и возраст >= 18',
          where: {
            AND: [
              { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
              { metadata_match: { path: ['profile', 'age'], gte: 18 } },
            ],
          },
          expect_ids: ['u1', 'u7'],
        },
        {
          id: 'json_match_007_or_country_or_age',
          title: 'OR: страна FR или возраст < 18',
          where: {
            OR: [
              { metadata_match: { path: ['profile', 'country'], equals: 'FR' } },
              { metadata_match: { path: ['profile', 'age'], lt: 18 } },
            ],
          },
          expect_ids: ['u2', 'u3', 'u8'],
        },
        {
          id: 'json_match_008_nested_and_or_not',
          title: 'Сложное сочетание AND + OR + AND',
          where: {
            AND: [
              {
                OR: [
                  { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
                  { metadata_match: { path: ['profile', 'country'], equals: 'FR' } },
                ],
              },
              {
                AND: [{ metadata_match: { path: ['profile', 'age'], gte: 18 } }],
              },
              { metadata_match: { path: ['tags'], array_contains: 'beta' } },
            ],
          },
          expect_ids: ['u1', 'u3', 'u7'],
        },
        {
          id: 'json_match_009_numeric_equals_type_sensitive',
          title: 'equals для числа не должен матчить строку "10"',
          where: { metadata_match: { path: ['score'], equals: 10 } },
          expect_ids: ['u1', 'u7'],
        },
        {
          id: 'json_match_010_numeric_range',
          title: 'numeric range: score между 10 и 20 включительно',
          where: {
            AND: [
              { metadata_match: { path: ['score'], gte: 10 } },
              { metadata_match: { path: ['score'], lte: 20 } },
            ],
          },
          expect_ids: ['u1', 'u3', 'u4', 'u7'],
        },
        {
          id: 'json_match_011_global_not_numeric_type_mismatch',
          title: 'numeric comparison включает type mismatch и missing path',
          where: { metadata_match: { path: ['score'], lt: 10 } },
          expect_ids: ['u2', 'u8'],
        },
        {
          id: 'json_match_012_string_contains',
          title: 'string_contains по email',
          where: { metadata_match: { path: ['profile', 'email'], string_contains: 'example.com' } },
          expect_ids: ['u1', 'u4', 'u5', 'u6', 'u8'],
        },
        {
          id: 'json_match_013_string_ends_with_and_not_country',
          title: 'string_ends_with + NOT country US',
          where: {
            AND: [
              { metadata_match: { path: ['profile', 'email'], string_ends_with: '.com' } },
              { metadata_match: { path: ['profile', 'country'], not: 'US' } },
            ],
          },
          expect_ids: ['u1', 'u4', 'u5', 'u8'],
        },
        {
          id: 'json_match_014_string_not_contains_includes_missing_path',
          title: 'string_not_contains включает missing path',
          where: {
            metadata_match: { path: ['profile', 'email'], string_not_contains: 'example.com' },
          },
          expect_ids: ['u2', 'u3', 'u7', 'u9'],
        },
        {
          id: 'json_match_015_string_case_sensitive',
          title: 'string_contains case-sensitive',
          where: { metadata_match: { path: ['profile', 'name'], string_contains: 'A' } },
          expect_ids: ['u1', 'u7'],
        },
        {
          id: 'json_match_016_string_empty_value',
          title: 'equals пустой строки',
          where: { metadata_match: { path: ['profile', 'name'], equals: '' } },
          expect_ids: ['u8'],
        },
        {
          id: 'json_match_017_array_contains_string',
          title: 'array_contains строкового элемента',
          where: { metadata_match: { path: ['tags'], array_contains: 'beta' } },
          expect_ids: ['u1', 'u3', 'u5', 'u7'],
        },
        {
          id: 'json_match_018_array_contains_object',
          title: 'array_contains объекта',
          where: { metadata_match: { path: ['tags'], array_contains: { code: 'x' } } },
          expect_ids: ['u5'],
        },
        {
          id: 'json_match_019_array_contains_number_type_sensitive',
          title: 'array_contains числа 0 не равен строке "0"',
          where: { metadata_match: { path: ['tags'], array_contains: 0 } },
          expect_ids: ['u8'],
        },
        {
          id: 'json_match_020_array_contains_string_zero_type_sensitive',
          title: 'array_contains строки "0" не равен числу 0',
          where: { metadata_match: { path: ['tags'], array_contains: '0' } },
          expect_ids: ['u8'],
        },
        {
          id: 'json_match_021_array_contains_string_beta',
          title: 'array_contains строкового элемента beta',
          where: { metadata_match: { path: ['tags'], array_contains: 'beta' } },
          expect_ids: ['u1', 'u3', 'u5', 'u7'],
        },
        {
          id: 'json_match_022_array_contains_false',
          title: 'array_contains boolean false',
          where: { metadata_match: { path: ['tags'], array_contains: false } },
          expect_ids: ['u8'],
        },
        {
          id: 'json_match_024_array_index_equals',
          title: 'Фильтр по конкретному индексу массива',
          where: { metadata_match: { path: ['tags', '0'], equals: 'beta' } },
          expect_ids: ['u1', 'u3', 'u5', 'u7'],
        },
        {
          id: 'json_match_025_array_index_type_sensitive',
          title: 'Индекс массива: строка "0" на позиции 0',
          where: { metadata_match: { path: ['tags', '0'], equals: '0' } },
          expect_ids: ['u8'],
        },
        {
          id: 'json_match_027_nested_array_second_item',
          title: 'Второй элемент массива',
          where: { metadata_match: { path: ['addresses', '1', 'city'], equals: 'Berlin' } },
          expect_ids: ['u6'],
        },
        {
          id: 'json_match_028_nested_array_missing_index',
          title: 'Отсутствующий индекс массива',
          where: { metadata_match: { path: ['addresses', '0', 'city'], exists: false } },
          expect_ids: ['u3', 'u4', 'u5', 'u9'],
        },
        {
          id: 'json_match_028_nested_array_missing_index2',
          title: 'Отсутствующий индекс массива',
          where: { metadata_match: { path: ['addresses', '0', 'city'], exists: true } },
          expect_ids: ['u1', 'u2', 'u6', 'u7', 'u8'],
        },
        {
          id: 'json_match_029_or_across_two_array_indexes',
          title: 'OR по первому и второму адресу',
          where: {
            OR: [
              { metadata_match: { path: ['addresses', '0', 'city'], equals: 'Berlin' } },
              { metadata_match: { path: ['addresses', '1', 'city'], equals: 'Berlin' } },
            ],
          },
          expect_ids: ['u1', 'u6'],
        },
        {
          id: 'json_match_030_boolean_true',
          title: 'equals boolean true',
          where: { metadata_match: { path: ['flags', 'emailVerified'], equals: true } },
          expect_ids: ['u1'],
        },
        {
          id: 'json_match_032_boolean_missing',
          title: 'exists false для boolean path',
          where: { metadata_match: { path: ['flags', 'emailVerified'], exists: false } },
          expect_ids: ['u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'],
        },
        {
          id: 'json_match_033_in_operator',
          title: 'in по scalar path',
          where: { metadata_match: { path: ['profile', 'country'], in: ['DE', 'FR'] } },
          expect_ids: ['u1', 'u2', 'u3', 'u7', 'u8'],
        },
        {
          id: 'json_match_034_not_in_includes_missing_path',
          title: 'not_in включает missing path',
          where: { metadata_match: { path: ['profile', 'country'], not_in: ['DE', 'FR'] } },
          expect_ids: ['u4', 'u5', 'u6', 'u9'],
        },
        {
          id: 'json_match_036_impossible_and',
          title: 'Противоречивый AND',
          where: {
            AND: [
              { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
              { metadata_match: { path: ['profile', 'country'], equals: 'US' } },
            ],
          },
          expect_ids: [],
        },
        {
          id: 'json_match_037_tautology_with_global_not',
          title: 'country = DE OR NOT(country = DE) матчится на все записи, включая missing',
          where: {
            OR: [
              { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
              { metadata_match: { path: ['profile', 'country'], not: 'DE' } },
            ],
          },
          expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'],
        },
        {
          id: 'json_match_040_exists_true_not_deleted',
          title: 'exists: true не матчит "удаленные" значения (они нормализуются в missing)',
          where: { metadata_match: { path: ['profile', 'middleName'], exists: true } },
          expect_ids: [],
        },
        {
          id: 'json_match_041_whole_json_not_null',
          title: 'path omitted: весь JSON не равен null',
          where: { metadata_match: { exists: true } },
          expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
        },
        {
          id: 'json_match_042_whole_json_is_null',
          title: 'path omitted: весь JSON равен null',
          where: { metadata_match: { exists: false } },
          expect_ids: ['u9'],
        },
        {
          id: 'json_match_043_global_not_whole_json_is_null',
          title: 'not: ["SOMETHING_ELSE"] включает missing path',
          where: { metadata_match: { not: ['SOMETHING_ELSE'] } },
          expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'],
        },
        {
          id: 'json_match_044_empty_array_equals_not_found',
          title: 'equals пустого массива не матчит ничего (т.к. [] нормализуется в missing)',
          where: { metadata_match: { path: ['misc', 'emptyArray'], equals: ['something'] } },
          expect_ids: [],
        },
        {
          id: 'json_match_045_empty_object_equals_not_found',
          title: 'equals пустого объекта не матчит ничего (т.к. {} нормализуется в missing)',
          where: { metadata_match: { path: ['misc', 'emptyObject'], equals: { a: 1 } } },
          expect_ids: [],
        },
        {
          id: 'json_match_046_string_operator_on_number_returns_false',
          title: 'string_contains на numeric path не матчится',
          where: { metadata_match: { path: ['profile', 'age'], string_contains: '2' } },
          expect_ids: [],
        },
        {
          id: 'json_match_047_array_contains_on_scalar_returns_false',
          title: 'array_contains на scalar path не матчится',
          where: { metadata_match: { path: ['score'], array_contains: 'NOT_FOUND' } },
          expect_ids: [],
        },
        {
          id: 'json_match_048_numeric_comparison_on_string_number_returns_false',
          title: 'gte на строке "10" не матчится',
          where: { metadata_match: { path: ['score'], gte: 10 } },
          expect_ids: ['u1', 'u3', 'u4', 'u6', 'u7'],
        },
        {
          id: 'json_match_049_complex_business_filter',
          title:
            'Сложный бизнес-фильтр: взрослый DE/FR пользователь с beta или paid, но не spam email',
          where: {
            AND: [
              {
                OR: [
                  { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
                  { metadata_match: { path: ['profile', 'country'], equals: 'FR' } },
                ],
              },
              { metadata_match: { path: ['profile', 'age'], gte: 18 } },
              {
                OR: [
                  { metadata_match: { path: ['tags'], array_contains: 'beta' } },
                  { metadata_match: { path: ['tags'], array_contains: 'paid' } },
                ],
              },
              { metadata_match: { path: ['profile', 'email'], string_not_contains: 'spam' } },
            ],
          },
          expect_ids: ['u1', 'u3', 'u7'],
        },
        {
          id: 'json_match_050_complex_missing_or_null_logic',
          title:
            'Компания отсутствует, но email существует и заканчивается на .com',
          where: {
            AND: [
              { metadata_match: { path: ['profile', 'company'], exists: false } },
              { metadata_match: { path: ['profile', 'email'], exists: true } },
              { metadata_match: { path: ['profile', 'email'], string_ends_with: '.com' } },
            ],
          },
          expect_ids: ['u1', 'u4', 'u5', 'u6', 'u8'],
        },
      ];

      testCases.forEach(({ id, title, where, expect_ids, expect_error }) => {
        test(`${id}: ${title}`, runner(setupKeystone, async ({ keystone }) => {
          await createFixture(keystone);
          const { ids, errors } = await runQuery(keystone, where);
          if (expect_error) {
            expect(errors).not.toBe(undefined);
            if (expect_error.code) {
              const hasExpectedCode = errors[0].extensions && errors[0].extensions.code === expect_error.code;
              const hasExpectedMessage = errors[0].message.includes(expect_error.code);
              expect(hasExpectedCode || hasExpectedMessage).toBe(true);
            }
            if (expect_error.message_contains) {
              expect(errors[0].message).toContain(expect_error.message_contains);
            }
          } else {
            expect(errors).toBe(undefined);
            expect(ids).toEqual((expect_ids || []).sort());
          }
        }));
      });

      describe('Invalid input test cases', () => {
        const invalidTestCases = [
          {
            id: 'json_match_invalid_001_empty_path',
            title: 'path не может быть пустым массивом',
            where: { metadata_match: { path: [], equals: 'DE' } },
            expect_error: { message_contains: 'JSON path cannot be empty' },
          },
          {
            id: 'json_match_invalid_002_dot_inside_segment',
            title: 'сегмент path не может содержать точку',
            where: { metadata_match: { path: ['profile.country'], equals: 'DE' } },
            expect_error: { message_contains: 'Invalid JSON path segment' },
          },
          {
            id: 'json_match_invalid_003_forbidden_proto_key',
            title: 'запрещаем __proto__',
            where: { metadata_match: { path: ['profile', '__proto__'], equals: 'x' } },
            expect_error: { message_contains: 'Invalid JSON path segment' },
          },
          {
            id: 'json_match_invalid_004_forbidden_constructor_key',
            title: 'запрещаем constructor',
            where: { metadata_match: { path: ['profile', 'constructor'], equals: 'x' } },
            expect_error: { message_contains: 'Invalid JSON path segment' },
          },
          {
            id: 'json_match_invalid_005_forbidden_prototype_key',
            title: 'запрещаем prototype',
            where: { metadata_match: { path: ['profile', 'prototype'], equals: 'x' } },
            expect_error: { message_contains: 'Invalid JSON path segment' },
          },
          {
            id: 'json_match_invalid_006_index_too_large',
            title: 'индекс массива больше разрешённого лимита',
            where: { metadata_match: { path: ['addresses', '10000', 'city'], equals: 'Berlin' } },
            expect_error: { message_contains: 'Invalid JSON path segment' },
          },
          {
            id: 'json_match_invalid_007_negative_index',
            title: 'отрицательные индексы запрещены',
            where: { metadata_match: { path: ['addresses', '-1', 'city'], equals: 'Berlin' } },
            expect_error: { message_contains: 'Invalid JSON path segment' },
          },
          {
            id: 'json_match_invalid_008_path_not_allowlisted',
            title: 'валидный синтаксис, но путь не в allow-list',
            where: { metadata_match: { path: ['profile', 'secretToken'], equals: 'abc' } },
            expect_error: { message_contains: 'is not allowed' },
          },
          {
            id: 'json_match_invalid_009_multiple_conditions',
            title: 'нельзя передавать два условия в одном JsonMatchInput',
            where: { metadata_match: { path: ['profile', 'country'], equals: 'DE', exists: true } },
            expect_error: { message_contains: 'Only one condition can be used in JsonMatchInput' },
          },
          {
            id: 'json_match_invalid_010_no_condition',
            title: 'нельзя передавать JsonMatchInput без условия',
            where: { metadata_match: { path: ['profile', 'country'] } },
            expect_error: { message_contains: 'condition' },
          },
          {
            id: 'json_match_invalid_011_null_inside_path_array',
            title: 'path: [String!] не допускает null внутри массива',
            where: { metadata_match: { path: ['profile', null], equals: 'DE' } },
            expect_error: { message_contains: 'null' },
          },
          {
            id: 'json_match_invalid_012_non_string_path_segment',
            title: 'path: [String!] не допускает number как сегмент',
            where: { metadata_match: { path: ['addresses', 0, 'city'], equals: 'Berlin' } },
            expect_error: { message_contains: 'String' },
          },
        ];

        invalidTestCases.forEach(({ id, title, where, expect_error }) => {
          test(`${id}: ${title}`, runner(setupKeystone, async ({ keystone }) => {
            const { errors } = await runQuery(keystone, where);
            expect(errors).not.toBe(undefined);
            if (expect_error.code) {
              const hasExpectedCode = errors[0].extensions && errors[0].extensions.code === expect_error.code;
              const hasExpectedMessage = errors[0].message.includes(expect_error.code);
              expect(hasExpectedCode || hasExpectedMessage).toBe(true);
            }
            if (expect_error.message_contains) {
              expect(errors[0].message).toContain(expect_error.message_contains);
            }
          }));
        });
      });

      describe('Equivalence tests', () => {
        const equivalenceTestCases = [
          {
            id: 'json_match_equivalence_002_not_equals_vs_match_not',
            title: 'JsonMatchInput.not и global not_in equals',
            left: { metadata_match: { path: ['profile', 'country'], not: 'MISSING' } },
            right: { metadata_match: { path: ['profile', 'country'], not_in: ['MISSING'] } },
            expect_equal_ids: true,
            expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'],
          },
          {
            id: 'json_match_equivalence_004_tautology',
            title: 'Tautology test',
            left: { metadata_match: { path: ['profile', 'middleName'], exists: false } },
            right: { metadata_match: { path: ['profile', 'middleName'], exists: false } },
            expect_equal_ids: true,
          },
        ];

        equivalenceTestCases.forEach(({ id, title, left, right, expect_equal_ids, expect_ids, left_expect_ids, right_expect_ids, skip }) => {
          test(`${id}: ${title}`, runner(setupKeystone, async ({ keystone }) => {
            if (skip && skip.includes(adapterName)) {
              return;
            }
            await createFixture(keystone);
            const { ids: leftIds } = await runQuery(keystone, left);
            const { ids: rightIds } = await runQuery(keystone, right);

            if (expect_equal_ids) {
              expect(leftIds).toEqual(rightIds);
              if (expect_ids) {
                expect(leftIds).toEqual(expect_ids.sort());
              }
            } else {
              expect(leftIds).not.toEqual(rightIds);
              if (left_expect_ids) {
                expect(leftIds).toEqual(left_expect_ids.sort());
              }
              if (right_expect_ids) {
                expect(rightIds).toEqual(right_expect_ids.sort());
              }
            }
          }));
        });
      });
    });
  })
);
