const { multiAdapterRunners, setupServer } = require('@open-keystone/test-utils');
const { Text, Json } = require('@open-keystone/fields');
const { createItem } = require('@open-keystone/server-side-graphql-client');

const fixture = [
  {
    id: 'u1',
    metadata: {
      profile: {
        country: 'DE',
        age: 29,
        email: 'alex@example.com',
        name: 'Alex',
        middleName: null,
        active: true,
      },
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
      profile: {
        country: 'FR',
        age: 35,
        email: 'clara@example.org',
        name: 'Clara',
        company: { tier: 'gold' },
      },
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

const jsonMatchFilterTests = [
  {
    id: 'json_match_001_equals_scalar',
    title: 'Equals nested country',
    result: 'Only u1, u2, u7, and u8 have profile.country exactly DE.',
    where: { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
    expect_ids: ['u1', 'u2', 'u7', 'u8'],
  },
  {
    id: 'json_match_002_not_scalar_negative_semantics',
    title: 'Not country with negative semantics',
    result:
      'Matches FR, null, US, missing country, and root null because not includes non-equal values, missing paths, and root field null.',
    where: { metadata_match: { path: ['profile', 'country'], not: 'DE' } },
    expect_ids: ['u3', 'u4', 'u5', 'u6', 'u9'],
  },
  {
    id: 'json_match_003_not_scalar_existing_only',
    title: 'Existing-only not country',
    result:
      'The exists:true guard removes missing/root-null records, leaving only existing country values that are not DE: FR, null, and US.',
    where: {
      AND: [
        { metadata_match: { path: ['profile', 'country'], exists: true } },
        { metadata_match: { path: ['profile', 'country'], not: 'DE' } },
      ],
    },
    expect_ids: ['u3', 'u5', 'u6'],
  },
  {
    id: 'json_match_004_equals_nested_null',
    title: 'Equals nested null',
    result:
      'Only u1 and u4 have profile.middleName explicitly set to nested JSON null; missing middleName and root null do not match equals:null with a path.',
    where: { metadata_match: { path: ['profile', 'middleName'], equals: null } },
    expect_ids: ['u1', 'u4'],
  },
  {
    id: 'json_match_005_not_nested_null_negative_semantics',
    title: 'Not nested null',
    result:
      'All records except u5 match: u5 has country explicitly null, while non-null country values, missing country, and root null satisfy not:null.',
    where: { metadata_match: { path: ['profile', 'country'], not: null } },
    expect_ids: ['u1', 'u2', 'u3', 'u4', 'u6', 'u7', 'u8', 'u9'],
  },
  {
    id: 'json_match_006_exists_false_missing_or_root_null',
    title: 'Missing middleName or root null',
    result:
      'Matches records where profile.middleName is missing plus u9 where metadata is root null; explicit nested null in u1 and u4 counts as existing.',
    where: { metadata_match: { path: ['profile', 'middleName'], exists: false } },
    expect_ids: ['u2', 'u3', 'u5', 'u6', 'u7', 'u8', 'u9'],
  },
  {
    id: 'json_match_007_exists_true_nested_null',
    title: 'Nested null exists',
    result: 'Only u1 and u4 match because nested JSON null is still an existing value.',
    where: { metadata_match: { path: ['profile', 'middleName'], exists: true } },
    expect_ids: ['u1', 'u4'],
  },
  {
    id: 'json_match_008_and_country_and_age',
    title: 'Country and age with AND',
    result: 'Only u1 and u7 are in DE and have numeric age >= 18; u2 is under 18 and u8 has age 0.',
    where: {
      AND: [
        { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
        { metadata_match: { path: ['profile', 'age'], number_gte: 18 } },
      ],
    },
    expect_ids: ['u1', 'u7'],
  },
  {
    id: 'json_match_009_or_country_or_age',
    title: 'Country or age with OR',
    result: 'u3 matches country FR; u2 and u8 match age < 18.',
    where: {
      OR: [
        { metadata_match: { path: ['profile', 'country'], equals: 'FR' } },
        { metadata_match: { path: ['profile', 'age'], number_lt: 18 } },
      ],
    },
    expect_ids: ['u2', 'u3', 'u8'],
  },
  {
    id: 'json_match_010_nested_and_or',
    title: 'Nested AND and OR',
    result: 'Only u1, u3, and u7 have country DE/FR, age >= 18, and a beta tag.',
    where: {
      AND: [
        {
          OR: [
            { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
            { metadata_match: { path: ['profile', 'country'], equals: 'FR' } },
          ],
        },
        { metadata_match: { path: ['profile', 'age'], number_gte: 18 } },
        { metadata_match: { path: ['tags'], array_contains: 'beta' } },
      ],
    },
    expect_ids: ['u1', 'u3', 'u7'],
  },
  {
    id: 'json_match_011_numeric_equals_type_sensitive',
    title: 'Numeric equals is type-sensitive',
    result:
      'Only u1 and u7 have numeric score 10; u5 has string "10", which is not equal to number 10.',
    where: { metadata_match: { path: ['score'], equals: 10 } },
    expect_ids: ['u1', 'u7'],
  },
  {
    id: 'json_match_012_numeric_range',
    title: 'Score in numeric range',
    result: 'Only u1, u3, u4, and u7 have numeric score between 10 and 20 inclusive.',
    where: {
      AND: [
        { metadata_match: { path: ['score'], number_gte: 10 } },
        { metadata_match: { path: ['score'], number_lte: 20 } },
      ],
    },
    expect_ids: ['u1', 'u3', 'u4', 'u7'],
  },
  {
    id: 'json_match_013_numeric_comparison_excludes_string_number',
    title: 'Numeric comparison ignores string numbers',
    result:
      'Only u1, u3, u4, u6, and u7 have numeric score >= 10; string "10" and smaller numbers do not match.',
    where: { metadata_match: { path: ['score'], number_gte: 10 } },
    expect_ids: ['u1', 'u3', 'u4', 'u6', 'u7'],
  },
  {
    id: 'json_match_014_numeric_lt',
    title: 'Score less than ten',
    result: 'Only u2 and u8 have numeric scores below 10: 0 and -1.',
    where: { metadata_match: { path: ['score'], number_lt: 10 } },
    expect_ids: ['u2', 'u8'],
  },
  {
    id: 'json_match_015_numeric_gt',
    title: 'Score greater than fifty',
    result: 'Only u6 has numeric score greater than 50.',
    where: { metadata_match: { path: ['score'], number_gt: 50 } },
    expect_ids: ['u6'],
  },
  {
    id: 'json_match_016_string_contains',
    title: 'Email contains example.com',
    result: 'Only u1, u4, u5, u6, and u8 have profile.email containing example.com.',
    where: { metadata_match: { path: ['profile', 'email'], string_contains: 'example.com' } },
    expect_ids: ['u1', 'u4', 'u5', 'u6', 'u8'],
  },
  {
    id: 'json_match_017_string_not_contains_negative_semantics',
    title: 'Email does not contain example.com',
    result:
      'u2, u3, and u7 have emails that do not contain example.com, and u9 also matches because negative string operators include root null.',
    where: { metadata_match: { path: ['profile', 'email'], string_not_contains: 'example.com' } },
    expect_ids: ['u2', 'u3', 'u7', 'u9'],
  },
  {
    id: 'json_match_018_string_not_contains_existing_only',
    title: 'Existing email does not contain example.com',
    result:
      'The exists:true guard removes u9, leaving only existing emails that do not contain example.com: u2, u3, and u7.',
    where: {
      AND: [
        { metadata_match: { path: ['profile', 'email'], exists: true } },
        { metadata_match: { path: ['profile', 'email'], string_not_contains: 'example.com' } },
      ],
    },
    expect_ids: ['u2', 'u3', 'u7'],
  },
  {
    id: 'json_match_019_string_ends_with_and_not_country',
    title: 'Dot-com email and not US',
    result:
      'The email must end with .com, and country must not be US; missing or null country is allowed by not, so u1, u4, u5, and u8 match.',
    where: {
      AND: [
        { metadata_match: { path: ['profile', 'email'], string_ends_with: '.com' } },
        { metadata_match: { path: ['profile', 'country'], not: 'US' } },
      ],
    },
    expect_ids: ['u1', 'u4', 'u5', 'u8'],
  },
  {
    id: 'json_match_020_string_starts_with',
    title: 'Name starts with A',
    result: 'Only Alex and Anna start with uppercase A, so u1 and u7 match.',
    where: { metadata_match: { path: ['profile', 'name'], string_starts_with: 'A' } },
    expect_ids: ['u1', 'u7'],
  },
  {
    id: 'json_match_021_string_not_starts_with_negative_semantics',
    title: 'Name does not start with A',
    result:
      'All names except Alex and Anna do not start with uppercase A; u9 also matches because the negative string operator includes root null.',
    where: { metadata_match: { path: ['profile', 'name'], string_not_starts_with: 'A' } },
    expect_ids: ['u2', 'u3', 'u4', 'u5', 'u6', 'u8', 'u9'],
  },
  {
    id: 'json_match_022_string_not_ends_with_negative_semantics',
    title: 'Email does not end with .com',
    result:
      'u2, u3, and u7 have emails that do not end with .com, and u9 matches because root null is included by the negative operator.',
    where: { metadata_match: { path: ['profile', 'email'], string_not_ends_with: '.com' } },
    expect_ids: ['u2', 'u3', 'u7', 'u9'],
  },
  {
    id: 'json_match_023_string_case_sensitive',
    title: 'String matching is case-sensitive',
    result: 'Only Alex and Anna contain uppercase A; lowercase a in other names does not match.',
    where: { metadata_match: { path: ['profile', 'name'], string_contains: 'A' } },
    expect_ids: ['u1', 'u7'],
  },
  {
    id: 'json_match_024_string_empty_value',
    title: 'Name equals empty string',
    result: 'Only u8 has profile.name equal to the empty string.',
    where: { metadata_match: { path: ['profile', 'name'], equals: '' } },
    expect_ids: ['u8'],
  },
  {
    id: 'json_match_025_array_contains_string',
    title: 'Tags contain beta',
    result: 'Only u1, u3, u5, and u7 have a tags array containing the string beta.',
    where: { metadata_match: { path: ['tags'], array_contains: 'beta' } },
    expect_ids: ['u1', 'u3', 'u5', 'u7'],
  },
  {
    id: 'json_match_026_array_not_contains_negative_semantics',
    title: 'Tags do not contain beta',
    result:
      'u2, u4, u6, and u8 have tags arrays without beta, and u9 matches because root null is included by array_not_contains.',
    where: { metadata_match: { path: ['tags'], array_not_contains: 'beta' } },
    expect_ids: ['u2', 'u4', 'u6', 'u8', 'u9'],
  },
  {
    id: 'json_match_027_array_not_contains_existing_array',
    title: 'Existing tags do not contain beta',
    result:
      'The exists:true guard removes root null, leaving existing tags arrays that do not contain beta: u2, u4, u6, and u8.',
    where: {
      AND: [
        { metadata_match: { path: ['tags'], exists: true } },
        { metadata_match: { path: ['tags'], array_not_contains: 'beta' } },
      ],
    },
    expect_ids: ['u2', 'u4', 'u6', 'u8'],
  },
  {
    id: 'json_match_028_array_contains_object',
    title: 'Tags contain object',
    result: 'Only u5 has a tags element deep-equal to { code: "x" }.',
    where: { metadata_match: { path: ['tags'], array_contains: { code: 'x' } } },
    expect_ids: ['u5'],
  },
  {
    id: 'json_match_029_array_not_contains_object',
    title: 'Tags do not contain object',
    result:
      'Every record except u5 lacks a tags element deep-equal to { code: "x" }; u9 also matches due to negative semantics.',
    where: { metadata_match: { path: ['tags'], array_not_contains: { code: 'x' } } },
    expect_ids: ['u1', 'u2', 'u3', 'u4', 'u6', 'u7', 'u8', 'u9'],
  },
  {
    id: 'json_match_030_array_contains_number_type_sensitive',
    title: 'Tags contain number zero',
    result: 'Only u8 has numeric 0 in tags; string "0" is a different JSON value.',
    where: { metadata_match: { path: ['tags'], array_contains: 0 } },
    expect_ids: ['u8'],
  },
  {
    id: 'json_match_031_array_contains_string_zero_type_sensitive',
    title: 'Tags contain string zero',
    result: 'Only u8 has string "0" in tags; numeric 0 is a different JSON value.',
    where: { metadata_match: { path: ['tags'], array_contains: '0' } },
    expect_ids: ['u8'],
  },
  {
    id: 'json_match_032_array_contains_null',
    title: 'Tags contain null',
    result: 'Only u8 has nested JSON null as an element in tags.',
    where: { metadata_match: { path: ['tags'], array_contains: null } },
    expect_ids: ['u8'],
  },
  {
    id: 'json_match_033_array_contains_false',
    title: 'Tags contain false',
    result: 'Only u8 has boolean false as an element in tags.',
    where: { metadata_match: { path: ['tags'], array_contains: false } },
    expect_ids: ['u8'],
  },
  {
    id: 'json_match_034_array_contains_and_array_not_contains',
    title: 'Beta but not paid',
    result: 'u1, u3, u5, and u7 contain beta, but u1 is excluded because it also contains paid.',
    where: {
      AND: [
        { metadata_match: { path: ['tags'], array_contains: 'beta' } },
        { metadata_match: { path: ['tags'], array_not_contains: 'paid' } },
      ],
    },
    expect_ids: ['u3', 'u5', 'u7'],
  },
  {
    id: 'json_match_035_array_index_equals',
    title: 'First tag is beta',
    result: 'Only u1, u3, u5, and u7 have tags[0] equal to beta.',
    where: { metadata_match: { path: ['tags', '0'], equals: 'beta' } },
    expect_ids: ['u1', 'u3', 'u5', 'u7'],
  },
  {
    id: 'json_match_036_array_index_type_sensitive',
    title: 'First tag is string zero',
    result: 'Only u8 has tags[0] equal to the string "0".',
    where: { metadata_match: { path: ['tags', '0'], equals: '0' } },
    expect_ids: ['u8'],
  },
  {
    id: 'json_match_037_nested_array_object_null',
    title: 'First address city is null',
    result: 'Only u5 has addresses[0].city explicitly set to nested JSON null.',
    where: { metadata_match: { path: ['addresses', '0', 'city'], equals: null } },
    expect_ids: ['u5'],
  },
  {
    id: 'json_match_038_nested_array_second_item',
    title: 'Second address city is Berlin',
    result: 'Only u6 has a second address whose city is Berlin.',
    where: { metadata_match: { path: ['addresses', '1', 'city'], equals: 'Berlin' } },
    expect_ids: ['u6'],
  },
  {
    id: 'json_match_039_nested_array_missing_index',
    title: 'First address city is missing',
    result:
      'u3 has an empty addresses array, u4 has no addresses path, and u9 has root null, so addresses[0].city is missing for them.',
    where: { metadata_match: { path: ['addresses', '0', 'city'], exists: false } },
    expect_ids: ['u3', 'u4', 'u9'],
  },
  {
    id: 'json_match_040_or_across_two_array_indexes',
    title: 'Berlin in first or second address',
    result:
      'u1 matches the first address city Berlin, and u6 matches the second address city Berlin.',
    where: {
      OR: [
        { metadata_match: { path: ['addresses', '0', 'city'], equals: 'Berlin' } },
        { metadata_match: { path: ['addresses', '1', 'city'], equals: 'Berlin' } },
      ],
    },
    expect_ids: ['u1', 'u6'],
  },
  {
    id: 'json_match_041_boolean_true',
    title: 'Boolean true match',
    result: 'Only u1 has flags.emailVerified equal to true.',
    where: { metadata_match: { path: ['flags', 'emailVerified'], equals: true } },
    expect_ids: ['u1'],
  },
  {
    id: 'json_match_042_boolean_false',
    title: 'Boolean false match',
    result: 'Only u2 has flags.emailVerified equal to false.',
    where: { metadata_match: { path: ['flags', 'emailVerified'], equals: false } },
    expect_ids: ['u2'],
  },
  {
    id: 'json_match_043_boolean_missing',
    title: 'Boolean path missing',
    result: 'All records except u1 and u2 lack flags.emailVerified or have root null.',
    where: { metadata_match: { path: ['flags', 'emailVerified'], exists: false } },
    expect_ids: ['u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'],
  },
  {
    id: 'json_match_044_in_operator',
    title: 'Country in DE or FR',
    result: 'Only u1, u2, u3, u7, and u8 have country in the set DE/FR.',
    where: { metadata_match: { path: ['profile', 'country'], in: ['DE', 'FR'] } },
    expect_ids: ['u1', 'u2', 'u3', 'u7', 'u8'],
  },
  {
    id: 'json_match_045_not_in_negative_semantics',
    title: 'Country not in DE or FR',
    result:
      'u6 has country US, u5 has country null, u4 is missing country, and u9 has root null; all satisfy not_in under negative semantics.',
    where: { metadata_match: { path: ['profile', 'country'], not_in: ['DE', 'FR'] } },
    expect_ids: ['u4', 'u5', 'u6', 'u9'],
  },
  {
    id: 'json_match_046_not_in_existing_only',
    title: 'Existing country not in DE or FR',
    result:
      'The exists:true guard removes missing/root-null records, leaving existing country values not in DE/FR: null and US.',
    where: {
      AND: [
        { metadata_match: { path: ['profile', 'country'], exists: true } },
        { metadata_match: { path: ['profile', 'country'], not_in: ['DE', 'FR'] } },
      ],
    },
    expect_ids: ['u5', 'u6'],
  },
  {
    id: 'json_match_047_impossible_and',
    title: 'Impossible country AND',
    result: 'No record can have profile.country equal to both DE and US at the same path.',
    where: {
      AND: [
        { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
        { metadata_match: { path: ['profile', 'country'], equals: 'US' } },
      ],
    },
    expect_ids: [],
  },
  {
    id: 'json_match_048_whole_json_equals_null',
    title: 'Whole JSON equals null',
    result: 'Only u9 has metadata set to field null.',
    where: { metadata_match: { equals: null } },
    expect_ids: ['u9'],
  },
  {
    id: 'json_match_049_whole_json_exists_false',
    title: 'Whole JSON exists false',
    result: 'Only u9 has no JSON document at the root field level.',
    where: { metadata_match: { exists: false } },
    expect_ids: ['u9'],
  },
  {
    id: 'json_match_050_whole_json_not_null',
    title: 'Whole JSON not null',
    result: 'All records except u9 have a non-null JSON document in metadata.',
    where: { metadata_match: { not: null } },
    expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
  },
  {
    id: 'json_match_051_whole_field_equals_null',
    title: 'Whole-field metadata null',
    result:
      'The whole-field exact filter metadata:null matches only the root field null record u9.',
    where: { metadata: null },
    expect_ids: ['u9'],
  },
  {
    id: 'json_match_052_whole_field_not_null',
    title: 'Whole-field metadata not null',
    result:
      'The whole-field exact filter metadata_not:null matches all records with a non-null metadata document: u1 through u8.',
    where: { metadata_not: null },
    expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
  },
  {
    id: 'json_match_053_empty_array_equals',
    title: 'Empty array equals',
    result: 'Only u5 preserves misc.emptyArray as an explicit empty array.',
    where: { metadata_match: { path: ['misc', 'emptyArray'], equals: [] } },
    expect_ids: ['u5'],
  },
  {
    id: 'json_match_054_empty_object_equals',
    title: 'Empty object equals',
    result: 'Only u5 preserves misc.emptyObject as an explicit empty object.',
    where: { metadata_match: { path: ['misc', 'emptyObject'], equals: {} } },
    expect_ids: ['u5'],
    // NOTE(pahaz): The issue is almost certainly not with the query itself,
    // but with how the document is stored. By default, Mongoose uses `minimize: true`,
    // which removes empty objects when saving. The official Mongoose documentation states
    // that empty objects are not persisted unless `minimize: false` is set;
    // with `minimize: false`, empty objects are stored as `{}`.
    // So `u5.metadata.misc.emptyObject = {}` most likely does not physically exist in MongoDB.
    // That's why neither `{ $eq: {} }`, nor `{}`, nor `$type` queries are able to match it.
    mongoose: [],
  },
  {
    id: 'json_match_055_string_operator_on_number_returns_false',
    title: 'String operator on number',
    result:
      'No record matches because profile.age is numeric where it exists, and positive string operators do not match numbers, missing paths, or root null.',
    where: { metadata_match: { path: ['profile', 'age'], string_contains: '2' } },
    expect_ids: [],
  },
  {
    id: 'json_match_056_array_contains_on_scalar_returns_false',
    title: 'Array contains on scalar',
    result:
      'No record matches because score is scalar where it exists, and positive array_contains requires an array.',
    where: { metadata_match: { path: ['score'], array_contains: 10 } },
    expect_ids: [],
  },
  {
    id: 'json_match_057_array_not_contains_on_scalar_returns_true',
    title: 'Array not contains on scalar',
    result:
      'Every record matches because existing score values are non-arrays and u9 is root null; array_not_contains treats both as matches.',
    where: { metadata_match: { path: ['score'], array_not_contains: 10 } },
    expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'],
    // NOTE(pahaz): Prisma documents JsonNull, DbNull, and AnyNull as null-enums, and also
    // states that these null-enums are not applicable to array_contains.
    // The issue is different: Prisma's JSON API does not expose a clean way to
    // express jsonb_typeof(path) IS DISTINCT FROM 'array'. That condition does
    // not seem expressible with Prisma JSON filters alone.
    // Prisma documents array_contains as a filter for array values; on PostgreSQL,
    // array_contains must receive an array, even when matching a single element.
    // However, Prisma JSON filters do not provide an operator for "path value is
    // not an array".
    prisma_postgresql: ['u9'],
  },
  {
    id: 'json_match_058_complex_business_filter',
    title: 'Adult DE/FR beta or paid user',
    result:
      'Only u1, u3, and u7 are adult DE/FR users with beta or paid tags and an email that does not contain spam.',
    where: {
      AND: [
        {
          OR: [
            { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
            { metadata_match: { path: ['profile', 'country'], equals: 'FR' } },
          ],
        },
        { metadata_match: { path: ['profile', 'age'], number_gte: 18 } },
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
    id: 'json_match_059_complex_missing_or_null_logic',
    title: 'Missing company or null country with .com email',
    result:
      'u1, u4, u5, u6, and u8 have missing company tier or null country, plus an existing .com email.',
    where: {
      AND: [
        {
          OR: [
            { metadata_match: { path: ['profile', 'company', 'tier'], exists: false } },
            { metadata_match: { path: ['profile', 'country'], equals: null } },
          ],
        },
        { metadata_match: { path: ['profile', 'email'], exists: true } },
        { metadata_match: { path: ['profile', 'email'], string_ends_with: '.com' } },
      ],
    },
    expect_ids: ['u1', 'u4', 'u5', 'u6', 'u8'],
  },
];

const jsonMatchInvalidInputTests = [
  {
    id: 'json_match_invalid_001_empty_path',
    title: 'path cannot be an empty array',
    result: 'Fails because path, when provided, must be a non-empty array.',
    where: { metadata_match: { path: [], equals: 'DE' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'JSON path cannot be empty' },
  },
  {
    id: 'json_match_invalid_002_dot_inside_segment',
    title: 'path segment cannot contain a dot',
    result: 'Fails because a path segment cannot contain dot notation.',
    where: { metadata_match: { path: ['profile.country'], equals: 'DE' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_003_jsonpath_string_segment',
    title: 'JSONPath string is not a valid path segment',
    result: 'Fails because JSONPath strings are not valid safe path tokens.',
    where: { metadata_match: { path: ['$.profile.country'], equals: 'DE' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_004_forbidden_proto_key',
    title: '__proto__ is forbidden as a path segment',
    result: 'Fails because __proto__ is forbidden as a path segment.',
    where: { metadata_match: { path: ['profile', '__proto__'], equals: 'x' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_005_forbidden_constructor_key',
    title: 'constructor is forbidden as a path segment',
    result: 'Fails because constructor is forbidden as a path segment.',
    where: { metadata_match: { path: ['profile', 'constructor'], equals: 'x' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_006_forbidden_prototype_key',
    title: 'prototype is forbidden as a path segment',
    result: 'Fails because prototype is forbidden as a path segment.',
    where: { metadata_match: { path: ['profile', 'prototype'], equals: 'x' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_007_forbidden_typename_key',
    title: '__typename is forbidden as a path segment',
    result: 'Fails because __typename is forbidden as a path segment.',
    where: { metadata_match: { path: ['profile', '__typename'], equals: 'x' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_008_wildcard_segment',
    title: 'wildcard path segment is forbidden',
    result: 'Fails because wildcard path segments are not supported.',
    where: { metadata_match: { path: ['profile', '*', 'country'], equals: 'DE' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_009_index_too_large',
    title: 'array index cannot exceed the allowed segment limit',
    result: 'Fails because array index segments are limited to 0 through 9999.',
    where: { metadata_match: { path: ['addresses', '10000', 'city'], equals: 'Berlin' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_010_negative_index',
    title: 'negative array indexes are forbidden',
    result: 'Fails because negative array indexes are not valid path segments.',
    where: { metadata_match: { path: ['addresses', '-1', 'city'], equals: 'Berlin' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Invalid JSON path segment' },
  },
  {
    id: 'json_match_invalid_011_path_not_allowlisted',
    title: 'syntactically valid path that is not in allowedPaths',
    result: 'Fails because the path is syntactically valid but not present in allowedPaths.',
    where: { metadata_match: { path: ['profile', 'secretToken'], equals: 'abc' } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'is not allowed' },
  },
  {
    id: 'json_match_invalid_012_multiple_conditions',
    title: 'only one operator can be used in one JsonMatchInput',
    result: 'Fails because one JsonMatchInput may contain exactly one operator.',
    where: { metadata_match: { path: ['profile', 'country'], equals: 'DE', exists: true } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'Only one condition can be used in JsonMatchInput' },
  },
  {
    id: 'json_match_invalid_013_no_condition',
    title: 'JsonMatchInput must contain one operator',
    result: 'Fails because path alone is not an operator and one operator is required.',
    where: { metadata_match: { path: ['profile', 'country'] } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'One condition is required in JsonMatchInput' },
  },
  {
    id: 'json_match_invalid_014_empty_in',
    title: 'in must be a non-empty array',
    result: 'Fails because in must receive a non-empty array.',
    where: { metadata_match: { path: ['profile', 'country'], in: [] } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'in must be a non-empty array' },
  },
  {
    id: 'json_match_invalid_015_empty_not_in',
    title: 'not_in must be a non-empty array',
    result: 'Fails because not_in must receive a non-empty array.',
    where: { metadata_match: { path: ['profile', 'country'], not_in: [] } },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'not_in must be a non-empty array' },
  },
  {
    id: 'json_match_invalid_016_empty_whole_field_in',
    title: 'metadata_in must be a non-empty array',
    result: 'Fails because metadata_in must receive a non-empty array.',
    where: { metadata_in: [] },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'metadata_in must be a non-empty array' },
  },
  {
    id: 'json_match_invalid_017_empty_whole_field_not_in',
    title: 'metadata_not_in must be a non-empty array',
    result: 'Fails because metadata_not_in must receive a non-empty array.',
    where: { metadata_not_in: [] },
    expect_error: { code: 'BAD_USER_INPUT', message_contains: 'metadata_not_in must be a non-empty array' },
  },
  {
    id: 'json_match_invalid_018_is_null_not_supported',
    title: 'is_null is not part of JsonMatchInput',
    result: 'Fails because is_null is not part of the JsonMatchInput schema.',
    where: { metadata_match: { path: ['profile', 'middleName'], is_null: true } },
    expect_error: { code: 'GRAPHQL_VALIDATION_FAILED', message_contains: 'Field "is_null" is not defined by type "JsonMatchInput"' },
  },
  {
    id: 'json_match_invalid_019_global_not_not_supported',
    title: 'global NOT is not part of this JSON filter specification',
    result: 'Fails because global NOT is outside this JSON filter specification.',
    where: { NOT: [{ metadata_match: { path: ['profile', 'country'], equals: 'DE' } }] },
    expect_error: { code: 'GRAPHQL_VALIDATION_FAILED', message_contains: 'Field "NOT" is not defined by type' },
  },
  {
    id: 'json_match_invalid_020_null_inside_path_array',
    title: 'path: [String!] does not allow null inside the array',
    result: 'Fails at GraphQL validation because path is [String!] and cannot contain null.',
    where: { metadata_match: { path: ['profile', null], equals: 'DE' } },
    expect_error: { code: 'GRAPHQL_VALIDATION_FAILED', message_contains: 'Expected non-nullable type String' },
  },
  {
    id: 'json_match_invalid_021_non_string_path_segment',
    title: 'path: [String!] does not allow a number as a segment',
    result: 'Fails at GraphQL validation because path segments must be strings.',
    where: { metadata_match: { path: ['addresses', 0, 'city'], equals: 'Berlin' } },
    expect_error: { code: 'GRAPHQL_VALIDATION_FAILED', message_contains: 'String' },
  },
];

const jsonMatchSemanticComparisonTests = [
  {
    id: 'json_match_semantic_001_root_null_forms_are_equivalent',
    title: 'metadata: null, metadata_match exists:false, and metadata_match equals:null are equivalent for root field null',
    result: 'Both forms select only u9 because root field null is equivalent to exists:false when path is omitted.',
    left: { metadata: null },
    right: { metadata_match: { exists: false } },
    expect_equal_ids: true,
    expect_ids: ['u9'],
  },
  {
    id: 'json_match_semantic_002_root_null_exists_false_equals_null_equivalent',
    title: 'metadata_match exists:false and metadata_match equals:null are equivalent when path is omitted',
    result: 'Both forms select only u9 because equals:null without path means the whole metadata field is null.',
    left: { metadata_match: { exists: false } },
    right: { metadata_match: { equals: null } },
    expect_equal_ids: true,
    expect_ids: ['u9'],
  },
  {
    id: 'json_match_semantic_003_root_not_null_field_filter_vs_exists_true',
    title: 'metadata_not:null and metadata_match exists:true are equivalent for root field not null',
    result: 'Both forms select u1 through u8 because they all have a non-null metadata document.',
    left: { metadata_not: null },
    right: { metadata_match: { exists: true } },
    expect_equal_ids: true,
    expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
  },
  {
    id: 'json_match_semantic_004_root_not_null_exists_true_vs_not_null',
    title: 'metadata_match exists:true and metadata_match not:null are equivalent when path is omitted',
    result: 'Both forms select u1 through u8 because exists:true and not:null are equivalent at the root field level.',
    left: { metadata_match: { exists: true } },
    right: { metadata_match: { not: null } },
    expect_equal_ids: true,
    expect_ids: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
  },
  {
    id: 'json_match_semantic_005_nested_null_is_not_missing',
    title: 'nested equals:null is not equivalent to exists:false',
    result: 'The left side selects explicit nested null in u1 and u4, while the right side selects missing path or root null records.',
    left: { metadata_match: { path: ['profile', 'middleName'], equals: null } },
    right: { metadata_match: { path: ['profile', 'middleName'], exists: false } },
    expect_equal_ids: false,
    left_expect_ids: ['u1', 'u4'],
    right_expect_ids: ['u2', 'u3', 'u5', 'u6', 'u7', 'u8', 'u9'],
  },
  {
    id: 'json_match_semantic_006_not_vs_existing_only_not',
    title: 'not includes missing path and root null unless paired with exists:true',
    result: 'Plain not includes u4 and u9 due to missing/root-null semantics; the exists:true version keeps only existing non-DE values.',
    left: { metadata_match: { path: ['profile', 'country'], not: 'DE' } },
    right: { AND: [{ metadata_match: { path: ['profile', 'country'], exists: true } }, { metadata_match: { path: ['profile', 'country'], not: 'DE' } }] },
    expect_equal_ids: false,
    left_expect_ids: ['u3', 'u4', 'u5', 'u6', 'u9'],
    right_expect_ids: ['u3', 'u5', 'u6'],
  },
  {
    id: 'json_match_semantic_007_not_in_vs_existing_only_not_in',
    title: 'not_in includes missing path and root null unless paired with exists:true',
    result: 'Plain not_in includes u4 and u9 due to missing/root-null semantics; the guarded version keeps only existing country values outside DE/FR.',
    left: { metadata_match: { path: ['profile', 'country'], not_in: ['DE', 'FR'] } },
    right: { AND: [{ metadata_match: { path: ['profile', 'country'], exists: true } }, { metadata_match: { path: ['profile', 'country'], not_in: ['DE', 'FR'] } }] },
    expect_equal_ids: false,
    left_expect_ids: ['u4', 'u5', 'u6', 'u9'],
    right_expect_ids: ['u5', 'u6'],
  },
  {
    id: 'json_match_semantic_008_string_not_contains_vs_existing_only',
    title: 'string_not_contains includes missing path and root null unless paired with exists:true',
    result: 'Plain string_not_contains includes u9 because root null matches negative string operators; the guarded version requires an existing email.',
    left: { metadata_match: { path: ['profile', 'email'], string_not_contains: 'example.com' } },
    right: { AND: [{ metadata_match: { path: ['profile', 'email'], exists: true } }, { metadata_match: { path: ['profile', 'email'], string_not_contains: 'example.com' } }] },
    expect_equal_ids: false,
    left_expect_ids: ['u2', 'u3', 'u7', 'u9'],
    right_expect_ids: ['u2', 'u3', 'u7'],
  },
  {
    id: 'json_match_semantic_009_array_not_contains_vs_existing_only',
    title: 'array_not_contains includes missing path and root null unless paired with exists:true',
    result: 'Plain array_not_contains includes u9 because root null matches negative array operators; the guarded version requires an existing tags value.',
    left: { metadata_match: { path: ['tags'], array_not_contains: 'beta' } },
    right: { AND: [{ metadata_match: { path: ['tags'], exists: true } }, { metadata_match: { path: ['tags'], array_not_contains: 'beta' } }] },
    expect_equal_ids: false,
    left_expect_ids: ['u2', 'u4', 'u6', 'u8', 'u9'],
    right_expect_ids: ['u2', 'u4', 'u6', 'u8'],
  },
];

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
              ['profile', 'company'],
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
        ...jsonMatchFilterTests,
        // ...jsonMatchInvalidInputTests,
      ];

      testCases.forEach(({ id, title, where, expect_ids, expect_error, ...expected }) => {
        test(
          `${id} : ${title}`,
          runner(setupKeystone, async ({ keystone }) => {
            await createFixture(keystone);
            const { ids, errors } = await runQuery(keystone, where);
            if (expect_error) {
              expect(errors).not.toBe(undefined);
              console.error(errors);
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
              const result = (adapterName in expected ? expected[adapterName] : expect_ids).sort();
              expect(ids.sort()).toEqual(result);
            }
          })
        );
      });

      describe('Equivalence tests', () => {
        const equivalenceTestCases = [
          // ...jsonMatchSemanticComparisonTests,
        ];

        equivalenceTestCases.forEach(
          ({
            id,
            title,
            left,
            right,
            expect_equal_ids,
            expect_ids,
            left_expect_ids,
            right_expect_ids,
            skip,
          }) => {
            test(
              `${id}: ${title}`,
              runner(setupKeystone, async ({ keystone }) => {
                if (skip && skip.includes(adapterName)) {
                  return;
                }
                await createFixture(keystone);
                const { ids: leftIds } = await runQuery(keystone, left);
                const { ids: rightIds } = await runQuery(keystone, right);

                if (expect_equal_ids) {
                  expect(leftIds.sort()).toEqual(rightIds.sort());
                  if (expect_ids) {
                    expect(leftIds.sort()).toEqual(expect_ids.sort());
                  }
                } else {
                  expect(leftIds.sort()).not.toEqual(rightIds.sort());
                  if (left_expect_ids) {
                    expect(leftIds.sort()).toEqual(left_expect_ids.sort());
                  }
                  if (right_expect_ids) {
                    expect(rightIds.sort()).toEqual(right_expect_ids.sort());
                  }
                }
              })
            );
          }
        );
      });
    });
  })
);
