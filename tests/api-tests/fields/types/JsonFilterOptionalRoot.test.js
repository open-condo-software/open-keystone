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
  { id: 'r8', metadata: '' },
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
    id: 'json_match_root_001_not_equals_empty_object',
    case: 'root not empty objects',
    result: 'Only r1 has metadata equal to the root empty object.',
    where: { metadata_match: { not: {} } },
    expect_ids: ['r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'],
  },
  {
    id: 'json_not_root_001_not_equals_empty_object',
    case: 'root not empty objects',
    result: 'Only r1 has metadata equal to the root empty object.',
    where: { metadata_not: {} },
    expect_ids: ['r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'],
  },
  {
    id: 'json_match_root_002_equals_empty_array',
    case: 'root empty array equals',
    result: 'Only r2 has metadata equal to the root empty array.',
    where: { metadata_match: { equals: [] } },
    expect_ids: ['r2'],
    // NOTE [mongoose]:
    // MongoDB does not treat `{ field: { $eq: [] } }` as strict root-value equality
    // when `field` itself is an array. It also matches documents where the array field
    // contains `[]` as one of its elements. Therefore r6 matches together with r2.
    mongoose: ['r2', 'r6'],
  },
  {
    id: 'json_match_root_002_not_equals_empty_array',
    case: 'root not empty array',
    result: 'Only r2 has metadata equal to the root empty array.',
    where: { metadata_match: { not: [] } },
    expect_ids: ['r1', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'],
    // NOTE [mongoose]:
    // This is the inverse side of MongoDB array matching. Since r6 contains `[]`
    // as an array element, MongoDB considers it related to `$eq: []`, so `$ne` / `$nor`
    // excludes r6 as well as the real root empty array r2.
    mongoose: ['r1', 'r3', 'r4', 'r5', 'r7', 'r8'],
  },
  {
    id: 'json_not_root_002_not_equals_empty_array',
    case: 'root not empty array',
    result: 'Only r2 has metadata equal to the root empty array.',
    where: { metadata_not: [] },
    expect_ids: ['r1', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'],
    // NOTE [mongoose]:
    // Same MongoDB array-field behavior as `metadata_match: { not: [] }`.
    // `metadata_not: []` is implemented through native Mongo equality negation,
    // so an array containing `[]` is excluded together with the root `[]` value.
    mongoose: ['r1', 'r3', 'r4', 'r5', 'r7', 'r8'],
  },
  {
    id: 'json_match_root_003_string_contains_root_text',
    case: 'path omitted string filter on root string',
    result: 'Only r3 is a root string containing text.',
    where: { metadata_match: { string_contains: 'text' } },
    expect_ids: ['r3'],
  },
  {
    id: 'json_match_root_003_string_not_contains_root_text',
    case: 'path omitted string filter on root string',
    result: 'Only r3 is a root string containing text.',
    where: { metadata_match: { string_not_contains: 'text' } },
    expect_ids: ['r1', 'r2', 'r4', 'r5', 'r6', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Prisma JSON string filters are not type-negative at the root level.
    // `NOT string_contains` only applies to JSON string values, so JSON objects,
    // arrays, numbers, booleans and null do not match here. Only r8 is a root string
    // that does not contain "text".
    prisma_postgresql: ['r8'],
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
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Prisma JSON `array_contains` / negation is type-scoped to JSON arrays.
    // The negated filter does not include non-array JSON root values, while the
    // contract-level semantics for other adapters treat non-arrays and root null
    // as matching the negative array operator. Only r2 is an array without "beta".
    prisma_postgresql: ['r2'],
  },
  {
    id: 'json_match_root_009_array_not_contains_empty_array',
    case: 'root array does not contain empty array element',
    result:
      'Only r6 contains [] as an element; r2 is itself an empty array but contains no elements.',
    where: { metadata_match: { array_not_contains: [] } },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Same Prisma limitation as above. The negated JSON array filter stays scoped
    // to root arrays, so non-array root values and root null are not included.
    // r2 is the only root array that does not contain `[]` as an element.
    prisma_postgresql: ['r2'],
  },
  {
    id: 'json_in_root_010_array_in_with_null',
    case: 'root element is null',
    result: 'Only r7 is a root null element.',
    where: { metadata_in: [null] },
    expect_ids: ['r7'],
    // NOTE [mongoose]:
    // Native MongoDB `$in` against an array field also checks individual array
    // elements. Because r6.metadata contains `null` as an element, `$in: [null]`
    // matches r6 in addition to the real root null value r7.
    mongoose: ['r6', 'r7'],
  },
  {
    id: 'json_in_root_011_array_with_empty_array',
    case: 'root element is empty array',
    result: 'Only r2 is a root empty array.',
    where: { metadata_in: [[]] },
    expect_ids: ['r2'],
    // NOTE [mongoose]:
    // Native MongoDB `$in` against an array field also checks individual array
    // elements. r2 is the root empty array, while r6 is a root array containing
    // `[]` as one of its elements, so both match `$in: [[]]`.
    mongoose: ['r2', 'r6'],
  },
  {
    id: 'json_not_in_root_012_array_not_in_with_null',
    case: 'root element is null',
    result: 'Everything except r7 matches: null is not in the root array.',
    where: { metadata_not_in: [null] },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r8'],
    // NOTE [mongoose]:
    // This is the negative side of MongoDB array-element `$in` behavior.
    // Since r6 contains `null` as an array element, MongoDB treats it as matching
    // `$in: [null]`, so `not_in: [null]` excludes r6 together with root null r7.
    mongoose: ['r1', 'r2', 'r3', 'r4', 'r5', 'r8'],
  },
  {
    id: 'json_match_in_root_013_array_not_in_empty_object',
    case: 'root element is empty object match not_in',
    result: 'Everything except r1 matches.',
    where: { metadata_match: { not_in: [{}] } },
    expect_ids: ['r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'],
  },
  {
    id: 'json_match_root_014_exists_false',
    case: 'root exists false',
    result: 'Only r7 is null (does not exist).',
    where: { metadata_match: { exists: false } },
    expect_ids: ['r7'],
    // NOTE [mongoose]:
    // MongoDB `{ field: null }` matches both a null field and an array field that
    // contains `null` as an element. Because root `exists: false` is represented
    // through the same native null check, r6 matches together with root null r7.
    mongoose: ['r6', 'r7'],
  },
  {
    id: 'json_root_015_field_equals_null',
    case: 'whole-field equals null',
    result: 'Only r7 is root null.',
    where: { metadata: null },
    expect_ids: ['r7'],
    // NOTE [mongoose]:
    // MongoDB `{ field: null }` also matches array fields that contain `null`
    // as an element, so r6 matches together with the real root null value r7.
    mongoose: ['r6', 'r7'],
  },
  {
    id: 'json_root_016_field_not_null',
    case: 'whole-field not null',
    result: 'Everything except r7 is not root null.',
    where: { metadata_not: null },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r8'],
    // NOTE [mongoose]:
    // Native MongoDB `$ne: null` excludes arrays containing null.
    // Since r6.metadata contains `null` as an element, r6 is excluded together with r7.
    mongoose: ['r1', 'r2', 'r3', 'r4', 'r5', 'r8'],
  },
  {
    id: 'json_match_root_017_not_null',
    case: 'root match not null',
    result: 'metadata_match not:null is equivalent to metadata_not:null.',
    where: { metadata_match: { not: null } },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r8'],
    // NOTE [mongoose]:
    // Same MongoDB null matching behavior as `metadata_not: null`.
    // Arrays containing null are treated as related to null.
    mongoose: ['r1', 'r2', 'r3', 'r4', 'r5', 'r8'],
  },
  {
    id: 'json_match_root_018_exists_true',
    case: 'root exists true',
    result: 'metadata_match exists:true is equivalent to metadata_not:null.',
    where: { metadata_match: { exists: true } },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r8'],
    // NOTE [mongoose]:
    // Root exists:true is implemented through native not-null semantics.
    // MongoDB excludes arrays containing null, so r6 does not match.
    mongoose: ['r1', 'r2', 'r3', 'r4', 'r5', 'r8'],
  },
  {
    id: 'json_match_root_019_equals_empty_string',
    case: 'root empty string equals',
    result: 'Only r8 is root empty string.',
    where: { metadata_match: { equals: '' } },
    expect_ids: ['r8'],
  },
  {
    id: 'json_match_root_020_not_empty_string',
    case: 'root not empty string',
    result: 'Everything except r8 is not root empty string.',
    where: { metadata_match: { not: '' } },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'],
  },
  {
    id: 'json_match_root_021_equals_zero',
    case: 'root zero equals',
    result: 'Only r4 is root number zero.',
    where: { metadata_match: { equals: 0 } },
    expect_ids: ['r4'],
  },
  {
    id: 'json_match_root_022_not_zero_type_sensitive',
    case: 'root not zero is type-sensitive',
    result: 'Everything except r4 matches; false is not equal to 0.',
    where: { metadata_match: { not: 0 } },
    expect_ids: ['r1', 'r2', 'r3', 'r5', 'r6', 'r7', 'r8'],
  },
  {
    id: 'json_match_root_023_in_zero_and_false',
    case: 'root in with zero and false',
    result: 'r4 is root 0 and r5 is root false; equality is type-sensitive.',
    where: { metadata_match: { in: [0, false] } },
    expect_ids: ['r4', 'r5'],
  },
  {
    id: 'json_match_root_024_not_in_zero_and_false',
    case: 'root not_in with zero and false',
    result: 'Everything except r4 and r5 matches.',
    where: { metadata_match: { not_in: [0, false] } },
    expect_ids: ['r1', 'r2', 'r3', 'r6', 'r7', 'r8'],
  },
  {
    id: 'json_in_root_025_array_in_with_null_and_empty_array',
    case: 'whole-field in with null and empty array',
    result: 'r7 is root null and r2 is root empty array.',
    where: { metadata_in: [null, []] },
    expect_ids: ['r2', 'r7'],
    // NOTE [mongoose]:
    // MongoDB `$in` also checks array elements. r6 contains both `null` and `[]`,
    // so it matches in addition to root null r7 and root empty array r2.
    mongoose: ['r2', 'r6', 'r7'],
  },
  {
    id: 'json_not_in_root_026_array_not_in_with_null_and_empty_array',
    case: 'whole-field not_in with null and empty array',
    result: 'Everything except root null r7 and root empty array r2 matches.',
    where: { metadata_not_in: [null, []] },
    expect_ids: ['r1', 'r3', 'r4', 'r5', 'r6', 'r8'],
    // NOTE [mongoose]:
    // Native MongoDB `$in` sees r6 as matching because it contains `null` and `[]`.
    // Therefore the negated form excludes r6 as well.
    mongoose: ['r1', 'r3', 'r4', 'r5', 'r8'],
  },
  {
    id: 'json_match_in_root_027_array_in_with_null_and_empty_array',
    case: 'metadata_match in with null and empty array',
    result: 'metadata_match root in should behave like whole-field metadata_in.',
    where: { metadata_match: { in: [null, []] } },
    expect_ids: ['r2', 'r7'],
    expected_error: 'Expected non-nullable type "JSON!" not to be null',
  },
  {
    id: 'json_match_not_in_root_028_array_not_in_with_null_and_empty_array',
    case: 'metadata_match not_in with null and empty array',
    result: 'metadata_match root not_in should behave like whole-field metadata_not_in.',
    where: { metadata_match: { not_in: [null, []] } },
    expect_ids: ['r1', 'r3', 'r4', 'r5', 'r6', 'r8'],
    expected_error: 'Expected non-nullable type "JSON!" not to be null',
  },
  {
    id: 'json_match_root_029_array_contains_null',
    case: 'root array contains null element',
    result: 'Only r6 is a root array containing null as an element.',
    where: { metadata_match: { array_contains: null } },
    expect_ids: ['r6'],
  },
  {
    id: 'json_match_root_030_array_not_contains_null',
    case: 'root array does not contain null element',
    result:
      'Everything except r6 matches: non-arrays, empty array, and root null satisfy negative array operator.',
    where: { metadata_match: { array_not_contains: null } },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Prisma negated JSON array filters are scoped to JSON arrays.
    // Non-array root values and root null are not included.
    prisma_postgresql: ['r2'],
  },
  {
    id: 'json_match_root_031_array_contains_object',
    case: 'root array contains object element',
    result: 'Only r6 contains { code: "root" } as an array element.',
    where: { metadata_match: { array_contains: { code: 'root' } } },
    expect_ids: ['r6'],
  },
  {
    id: 'json_match_root_032_array_not_contains_object',
    case: 'root array does not contain object element',
    result: 'Everything except r6 matches.',
    where: { metadata_match: { array_not_contains: { code: 'root' } } },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Same Prisma limitation as other negated root array filters.
    // Only root arrays are considered by the generated JSON array filter.
    prisma_postgresql: ['r2'],
  },
  {
    id: 'json_match_root_033_array_contains_false',
    case: 'root array contains false element',
    result: 'No root array contains false; r5 is root false, not an array element.',
    where: { metadata_match: { array_contains: false } },
    expect_ids: [],
  },
  {
    id: 'json_match_root_034_array_contains_zero',
    case: 'root array contains zero element',
    result: 'No root array contains 0; r4 is root 0, not an array element.',
    where: { metadata_match: { array_contains: 0 } },
    expect_ids: [],
  },
  {
    id: 'json_match_root_035_string_starts_with_root',
    case: 'root string starts with root',
    result: 'Only r3 is a root string starting with root.',
    where: { metadata_match: { string_starts_with: 'root' } },
    expect_ids: ['r3'],
  },
  {
    id: 'json_match_root_036_string_not_starts_with_root',
    case: 'root string does not start with root',
    result: 'Everything except r3 matches under contract-level negative string semantics.',
    where: { metadata_match: { string_not_starts_with: 'root' } },
    expect_ids: ['r1', 'r2', 'r4', 'r5', 'r6', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Prisma JSON negative string filters remain scoped to JSON strings.
    // Only r8 is a root string that does not start with "root".
    prisma_postgresql: ['r8'],
  },
  {
    id: 'json_match_root_037_string_ends_with_text',
    case: 'root string ends with text',
    result: 'Only r3 is a root string ending with text.',
    where: { metadata_match: { string_ends_with: 'text' } },
    expect_ids: ['r3'],
  },
  {
    id: 'json_match_root_038_string_not_ends_with_text',
    case: 'root string does not end with text',
    result: 'Everything except r3 matches under contract-level negative string semantics.',
    where: { metadata_match: { string_not_ends_with: 'text' } },
    expect_ids: ['r1', 'r2', 'r4', 'r5', 'r6', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Prisma JSON negative string filters remain scoped to JSON strings.
    // Only r8 is a root string that does not end with "text".
    prisma_postgresql: ['r8'],
  },
  {
    id: 'json_complex_root_015_and_name_with_not_empty_object',
    case: 'AND grouping: name r1 and metadata is not empty object',
    result:
      'No records match: r1 has metadata equal to {}, so metadata_match not:{} must exclude it.',
    where: {
      AND: [{ name: 'r1' }, { metadata_match: { not: {} } }],
    },
    expect_ids: [],
  },
  {
    id: 'json_complex_root_016_or_nested_and_grouping',
    case: 'Nested OR with AND branches',
    result: 'Only r2 matches: first branch is impossible for r1, second branch matches r2 root [].',
    where: {
      OR: [
        {
          AND: [{ name: 'r1' }, { metadata_match: { not: {} } }],
        },
        {
          AND: [{ name: 'r2' }, { metadata_match: { equals: [] } }],
        },
      ],
    },
    expect_ids: ['r2'],
  },
  {
    id: 'json_complex_root_017_negative_string_and_negative_array',
    case: 'AND: root string_not_contains text and root not empty array',
    result:
      'Everything except r2 and r3 matches under contract semantics: r2 is [], r3 contains text.',
    where: {
      AND: [{ metadata_match: { string_not_contains: 'text' } }, { metadata_match: { not: [] } }],
    },
    expect_ids: ['r1', 'r4', 'r5', 'r6', 'r7', 'r8'],
    // NOTE [mongoose]:
    // MongoDB treats an array containing `[]` as related to `$eq: []`.
    // Therefore `not: []` excludes r6 together with the real root [] value r2.
    mongoose: ['r1', 'r4', 'r5', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Prisma root negative string filters are scoped to JSON strings.
    // Only r8 is a string that does not contain "text"; after `not: []`,
    // r8 is still the only matching record.
    prisma_postgresql: ['r8'],
  },
  {
    id: 'json_complex_root_018_or_string_array_boolean',
    case: 'OR: root string contains text, array contains beta, or equals false',
    result: 'r3 is the root string, r6 is the beta array, and r5 is root false.',
    where: {
      OR: [
        { metadata_match: { string_contains: 'text' } },
        { metadata_match: { array_contains: 'beta' } },
        { metadata_match: { equals: false } },
      ],
    },
    expect_ids: ['r3', 'r5', 'r6'],
  },
  {
    id: 'json_complex_root_019_array_contains_beta_and_not_in_null',
    case: 'AND: root array contains beta and whole-field not_in null',
    result: 'Only r6 matches under contract semantics: r6 is not root null and contains beta.',
    where: {
      AND: [{ metadata_match: { array_contains: 'beta' } }, { metadata_not_in: [null] }],
    },
    expect_ids: ['r6'],
    // NOTE [mongoose]:
    // MongoDB `$in: [null]` also matches array fields containing `null`.
    // r6 contains null as an element, so `metadata_not_in: [null]` excludes r6.
    mongoose: [],
  },
  {
    id: 'json_complex_root_020_array_contains_empty_array_and_not_in_null',
    case: 'AND: root array contains [] and whole-field not_in null',
    result:
      'Only r6 matches under contract semantics: r6 is not root null and contains [] as an element.',
    where: {
      AND: [{ metadata_match: { array_contains: [] } }, { metadata_not_in: [null] }],
    },
    expect_ids: ['r6'],
    // NOTE [mongoose]:
    // Same MongoDB null behavior as above. r6 contains null as an array element,
    // so the native negated `$in: [null]` check excludes it.
    mongoose: [],
  },
  {
    id: 'json_complex_root_021_exists_true_and_array_contains_beta',
    case: 'AND: root exists true and array contains beta',
    result:
      'Only r6 matches under contract semantics: r6 is a non-null root array containing beta.',
    where: {
      AND: [{ metadata_match: { exists: true } }, { metadata_match: { array_contains: 'beta' } }],
    },
    expect_ids: ['r6'],
    // NOTE [mongoose]:
    // Root exists:true is implemented through MongoDB native not-null semantics.
    // MongoDB treats arrays containing null as related to null, so r6 is excluded.
    mongoose: [],
  },
  {
    id: 'json_complex_root_022_negative_array_and_negative_string',
    case: 'AND: array_not_contains beta and string_not_contains text',
    result: 'Everything except r3 and r6 matches under contract semantics.',
    where: {
      AND: [
        { metadata_match: { array_not_contains: 'beta' } },
        { metadata_match: { string_not_contains: 'text' } },
      ],
    },
    expect_ids: ['r1', 'r2', 'r4', 'r5', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Prisma keeps both negated JSON filters type-scoped.
    // `array_not_contains` only returns root arrays without beta (r2),
    // while `string_not_contains` only returns root strings without text (r8).
    // Their intersection is empty.
    prisma_postgresql: [],
  },
  {
    id: 'json_complex_root_023_or_negative_array_or_positive_string',
    case: 'OR: array_not_contains beta or string_contains text',
    result:
      'Everything except r6 matches: r6 contains beta, while r3 is included by string_contains.',
    where: {
      OR: [
        { metadata_match: { array_not_contains: 'beta' } },
        { metadata_match: { string_contains: 'text' } },
      ],
    },
    expect_ids: ['r1', 'r2', 'r3', 'r4', 'r5', 'r7', 'r8'],
    // NOTE [prisma_postgresql]:
    // Prisma negated array filters are scoped to arrays, so only r2 matches
    // `array_not_contains: beta`; r3 matches the positive string branch.
    prisma_postgresql: ['r2', 'r3'],
  },
  {
    id: 'json_complex_root_024_match_in_null_empty_array_and_array_not_contains_empty_array',
    case: 'AND: root in [null, []] and array_not_contains []',
    result:
      'r2 is root [], r7 is root null; both satisfy array_not_contains [] under contract semantics.',
    where: {
      AND: [{ metadata_in: [null, []] }, { metadata_match: { array_not_contains: [] } }],
    },
    expect_ids: ['r2', 'r7'],
    // NOTE [prisma_postgresql]:
    // Prisma negated array filters remain scoped to root arrays.
    // r7 is root null and is not included by Prisma's array_not_contains branch.
    prisma_postgresql: ['r2'],
  },
  {
    id: 'json_complex_root_025_match_in_falsy_values',
    case: 'root in with falsy values',
    result: 'r4 is 0, r5 is false, r8 is empty string. This catches truthy/falsy operator bugs.',
    where: {
      metadata_match: { in: [0, false, ''] },
    },
    expect_ids: ['r4', 'r5', 'r8'],
  },
  {
    id: 'json_complex_root_026_match_not_in_empty_object_and_not_empty_array',
    case: 'AND: root not_in [{}] and root not []',
    result: 'Everything except r1 and r2 matches under contract semantics.',
    where: {
      AND: [{ metadata_match: { not_in: [{}] } }, { metadata_match: { not: [] } }],
    },
    expect_ids: ['r3', 'r4', 'r5', 'r6', 'r7', 'r8'],
    // NOTE [mongoose]:
    // MongoDB treats r6 as related to [] because r6 is an array containing []
    // as an element. Therefore `not: []` excludes r6 as well.
    mongoose: ['r3', 'r4', 'r5', 'r7', 'r8'],
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
        ({ id, case: title, where, expect_ids, expected_error, ...expected }) => {
          test(
            `${id} : ${title}`,
            runner(setupKeystone, async ({ keystone }) => {
              await createFixture(keystone);
              const { ids, errors } = await runQuery(keystone, where);
              if (expected_error) {
                expect(errors).not.toBe(undefined);
                expect(errors[0].message).toMatch(expected_error);
              } else {
                expect(errors).toBe(undefined);
                const result = (
                  adapterName in expected ? expected[adapterName] : expect_ids
                ).sort();
                expect(ids.sort()).toEqual(result);
              }
            })
          );
        }
      );
    });
  })
);
