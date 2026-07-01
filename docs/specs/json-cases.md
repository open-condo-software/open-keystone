# Contract tests for JSON field filters

These tests are aligned with `json.md`: `JsonMatchInput`, `WhereInput` uses only `AND` and `OR`, and negative JSON operators intentionally match missing paths and root field `null`.

## Assumptions

```graphql
input JsonMatchInput {
  path: [String!]

  equals: JSON
  not: JSON

  in: [JSON!]
  not_in: [JSON!]

  exists: Boolean

  number_lt: Float
  number_lte: Float
  number_gt: Float
  number_gte: Float

  string_contains: String
  string_not_contains: String
  string_starts_with: String
  string_not_starts_with: String
  string_ends_with: String
  string_not_ends_with: String

  array_contains: JSON
  array_not_contains: JSON
}
```

`WhereInput` supports:

```graphql
AND: [WhereInput!]
OR: [WhereInput!]
```

Rules:

```yaml
semantics:
  json_match:
    exactly_one_operator_required: true
    path_omitted_means_whole_json_field: true
    global_not_supported: false

    root_field_null:
      metadata_match_exists_false: true
      metadata_match_equals_null_without_path: true
      nested_paths_are_missing: true

    nested_json_null:
      exists_true: true
      exists_false: false
      equals_null: true
      missing_path: false

    positive_operators:
      missing_path_matches: false
      root_field_null_matches: false
      type_mismatch_matches: false

    negative_operators:
      missing_path_matches: true
      root_field_null_matches: true
      type_mismatch_matches: true_for_string_and_array_negative_operators

    equality:
      type_sensitive: true
      object_key_order_ignored: true
      array_order_significant: true

    array_contains:
      requires_existing_array: true
      comparison: deep equality against one array element

    array_not_contains:
      missing_path_matches: true
      root_field_null_matches: true
      non_array_matches: true
      comparison: no deep-equal array element
```

## Fixture

```yaml
records:
  - id: u1
    metadata:
      profile:
        country: DE
        age: 29
        email: alex@example.com
        name: Alex
        middleName: null
        active: true
      tags:
        - beta
        - paid
      score: 10
      addresses:
        - city: Berlin
          zip: '10115'
      flags:
        emailVerified: true
  - id: u2
    metadata:
      profile:
        country: DE
        age: 17
        email: bob@spam.test
        name: bob
        active: false
      tags:
        - free
      score: 0
      addresses:
        - city: Munich
      flags:
        emailVerified: false
  - id: u3
    metadata:
      profile:
        country: FR
        age: 35
        email: clara@example.org
        name: Clara
        company:
          tier: gold
      tags:
        - beta
        - internal
      score: 15
      addresses: []
  - id: u4
    metadata:
      profile:
        age: 42
        email: dora@example.com
        name: Dora
        middleName: null
      tags: []
      score: 20
      settings: null
  - id: u5
    metadata:
      profile:
        country: null
        age: 30
        email: eve@example.com
        name: Eve
      tags:
        - beta
        - code: x
      score: '10'
      addresses:
        - city: null
      misc:
        emptyArray: []
        emptyObject: {}
  - id: u6
    metadata:
      profile:
        country: US
        age: 65
        email: root@example.com
        name: Root
      tags:
        - enterprise
        - paid
      score: 100
      addresses:
        - city: New York
        - city: Berlin
  - id: u7
    metadata:
      profile:
        country: DE
        age: 29
        email: anna@test.de
        name: Anna
      tags:
        - beta
      score: 10
      addresses:
        - city: Hamburg
      preferences:
        newsletter: false
  - id: u8
    metadata:
      profile:
        country: DE
        age: 0
        email: zero@example.com
        name: ''
      tags:
        - '0'
        - 0
        - false
        - null
      score: -1
      addresses:
        - city: ''
  - id: u9
    metadata: null
```

## Allowed paths

```yaml
allowed_json_paths:
  User:
    metadata:
      - [profile, country]
      - [profile, age]
      - [profile, email]
      - [profile, name]
      - [profile, middleName]
      - [profile, active]
      - [profile, company, tier]
      - [tags]
      - [tags, '0']
      - [tags, '1']
      - [tags, '3']
      - [score]
      - [addresses]
      - [addresses, '0', city]
      - [addresses, '1', city]
      - [flags, emailVerified]
      - [settings]
      - [misc, emptyArray]
      - [misc, emptyObject]
      - [preferences, newsletter]
```

# Valid filtering test cases

```yaml
tests:
  - id: json_match_001_equals_scalar
    title: equals on a nested scalar value
    where:
      metadata_match:
        path:
          - profile
          - country
        equals: DE
    expect_ids:
      - u1
      - u2
      - u7
      - u8
  - id: json_match_002_not_scalar_negative_semantics
    title: not includes missing path, root null, and values that are not equal
    where:
      metadata_match:
        path:
          - profile
          - country
        not: DE
    expect_ids:
      - u3
      - u4
      - u5
      - u6
      - u9
  - id: json_match_003_not_scalar_existing_only
    title: 'existing-only not is expressed with AND + exists: true'
    where:
      AND:
        - metadata_match:
            path:
              - profile
              - country
            exists: true
        - metadata_match:
            path:
              - profile
              - country
            not: DE
    expect_ids:
      - u3
      - u5
      - u6
  - id: json_match_004_equals_nested_null
    title: equals null on a nested path matches explicit nested JSON null only
    where:
      metadata_match:
        path:
          - profile
          - middleName
        equals: null
    expect_ids:
      - u1
      - u4
  - id: json_match_005_not_nested_null_negative_semantics
    title: not null on a nested path includes missing path and root field null, but excludes explicit nested JSON null
    where:
      metadata_match:
        path:
          - profile
          - country
        not: null
    expect_ids:
      - u1
      - u2
      - u3
      - u4
      - u6
      - u7
      - u8
      - u9
  - id: json_match_006_exists_false_missing_or_root_null
    title: 'exists: false on a nested path matches missing path and root field null'
    where:
      metadata_match:
        path:
          - profile
          - middleName
        exists: false
    expect_ids:
      - u2
      - u3
      - u5
      - u6
      - u7
      - u8
      - u9
  - id: json_match_007_exists_true_nested_null
    title: 'exists: true on a nested path treats nested JSON null as existing'
    where:
      metadata_match:
        path:
          - profile
          - middleName
        exists: true
    expect_ids:
      - u1
      - u4
  - id: json_match_008_and_country_and_age
    title: 'AND: country is DE and age is at least 18'
    where:
      AND:
        - metadata_match:
            path:
              - profile
              - country
            equals: DE
        - metadata_match:
            path:
              - profile
              - age
            number_gte: 18
    expect_ids:
      - u1
      - u7
  - id: json_match_009_or_country_or_age
    title: 'OR: country is FR or age is less than 18'
    where:
      OR:
        - metadata_match:
            path:
              - profile
              - country
            equals: FR
        - metadata_match:
            path:
              - profile
              - age
            number_lt: 18
    expect_ids:
      - u2
      - u3
      - u8
  - id: json_match_010_nested_and_or
    title: Nested AND + OR without global NOT
    where:
      AND:
        - OR:
            - metadata_match:
                path:
                  - profile
                  - country
                equals: DE
            - metadata_match:
                path:
                  - profile
                  - country
                equals: FR
        - metadata_match:
            path:
              - profile
              - age
            number_gte: 18
        - metadata_match:
            path:
              - tags
            array_contains: beta
    expect_ids:
      - u1
      - u3
      - u7
  - id: json_match_011_numeric_equals_type_sensitive
    title: numeric equals is type-sensitive and does not match string '10'
    where:
      metadata_match:
        path:
          - score
        equals: 10
    expect_ids:
      - u1
      - u7
  - id: json_match_012_numeric_range
    title: 'numeric range: score is between 10 and 20 inclusive'
    where:
      AND:
        - metadata_match:
            path:
              - score
            number_gte: 10
        - metadata_match:
            path:
              - score
            number_lte: 20
    expect_ids:
      - u1
      - u3
      - u4
      - u7
  - id: json_match_013_numeric_comparison_excludes_string_number
    title: numeric comparison on string '10' returns false
    where:
      metadata_match:
        path:
          - score
        number_gte: 10
    expect_ids:
      - u1
      - u3
      - u4
      - u6
      - u7
  - id: json_match_014_numeric_lt
    title: numeric number_lt matches zero and negative numbers
    where:
      metadata_match:
        path:
          - score
        number_lt: 10
    expect_ids:
      - u2
      - u8
  - id: json_match_015_numeric_gt
    title: numeric number_gt matches values greater than 50
    where:
      metadata_match:
        path:
          - score
        number_gt: 50
    expect_ids:
      - u6
  - id: json_match_016_string_contains
    title: string_contains on email
    where:
      metadata_match:
        path:
          - profile
          - email
        string_contains: example.com
    expect_ids:
      - u1
      - u4
      - u5
      - u6
      - u8
  - id: json_match_017_string_not_contains_negative_semantics
    title: string_not_contains includes missing path and root field null
    where:
      metadata_match:
        path:
          - profile
          - email
        string_not_contains: example.com
    expect_ids:
      - u2
      - u3
      - u7
      - u9
  - id: json_match_018_string_not_contains_existing_only
    title: 'existing-only string_not_contains is expressed with AND + exists: true'
    where:
      AND:
        - metadata_match:
            path:
              - profile
              - email
            exists: true
        - metadata_match:
            path:
              - profile
              - email
            string_not_contains: example.com
    expect_ids:
      - u2
      - u3
      - u7
  - id: json_match_019_string_ends_with_and_not_country
    title: string_ends_with plus explicit negative country operator
    where:
      AND:
        - metadata_match:
            path:
              - profile
              - email
            string_ends_with: .com
        - metadata_match:
            path:
              - profile
              - country
            not: US
    expect_ids:
      - u1
      - u4
      - u5
      - u8
  - id: json_match_020_string_starts_with
    title: string_starts_with on name
    where:
      metadata_match:
        path:
          - profile
          - name
        string_starts_with: A
    expect_ids:
      - u1
      - u7
  - id: json_match_021_string_not_starts_with_negative_semantics
    title: string_not_starts_with includes missing path and root field null
    where:
      metadata_match:
        path:
          - profile
          - name
        string_not_starts_with: A
    expect_ids:
      - u2
      - u3
      - u4
      - u5
      - u6
      - u8
      - u9
  - id: json_match_022_string_not_ends_with_negative_semantics
    title: string_not_ends_with includes missing path and root field null
    where:
      metadata_match:
        path:
          - profile
          - email
        string_not_ends_with: .com
    expect_ids:
      - u2
      - u3
      - u7
      - u9
  - id: json_match_023_string_case_sensitive
    title: string_contains is case-sensitive
    where:
      metadata_match:
        path:
          - profile
          - name
        string_contains: A
    expect_ids:
      - u1
      - u7
  - id: json_match_024_string_empty_value
    title: equals on an empty string
    where:
      metadata_match:
        path:
          - profile
          - name
        equals: ''
    expect_ids:
      - u8
  - id: json_match_025_array_contains_string
    title: array_contains on a string element
    where:
      metadata_match:
        path:
          - tags
        array_contains: beta
    expect_ids:
      - u1
      - u3
      - u5
      - u7
  - id: json_match_026_array_not_contains_negative_semantics
    title: array_not_contains includes arrays without the item, missing path, non-arrays, and root field null
    where:
      metadata_match:
        path:
          - tags
        array_not_contains: beta
    expect_ids:
      - u2
      - u4
      - u6
      - u8
      - u9
  - id: json_match_027_array_not_contains_existing_array
    title: 'existing-array array_not_contains is expressed with AND + exists: true'
    where:
      AND:
        - metadata_match:
            path:
              - tags
            exists: true
        - metadata_match:
            path:
              - tags
            array_not_contains: beta
    expect_ids:
      - u2
      - u4
      - u6
      - u8
  - id: json_match_028_array_contains_object
    title: array_contains on an object element uses deep equality
    where:
      metadata_match:
        path:
          - tags
        array_contains:
          code: x
    expect_ids:
      - u5
  - id: json_match_029_array_not_contains_object
    title: array_not_contains on an object element uses deep equality
    where:
      metadata_match:
        path:
          - tags
        array_not_contains:
          code: x
    expect_ids:
      - u1
      - u2
      - u3
      - u4
      - u6
      - u7
      - u8
      - u9
  - id: json_match_030_array_contains_number_type_sensitive
    title: array_contains number 0 is not equal to string '0'
    where:
      metadata_match:
        path:
          - tags
        array_contains: 0
    expect_ids:
      - u8
  - id: json_match_031_array_contains_string_zero_type_sensitive
    title: array_contains string '0' is not equal to number 0
    where:
      metadata_match:
        path:
          - tags
        array_contains: '0'
    expect_ids:
      - u8
  - id: json_match_032_array_contains_null
    title: array_contains JSON null
    where:
      metadata_match:
        path:
          - tags
        array_contains: null
    expect_ids:
      - u8
  - id: json_match_033_array_contains_false
    title: array_contains boolean false
    where:
      metadata_match:
        path:
          - tags
        array_contains: false
    expect_ids:
      - u8
  - id: json_match_034_array_contains_and_array_not_contains
    title: Has beta tag but does not contain paid tag
    where:
      AND:
        - metadata_match:
            path:
              - tags
            array_contains: beta
        - metadata_match:
            path:
              - tags
            array_not_contains: paid
    expect_ids:
      - u3
      - u5
      - u7
  - id: json_match_035_array_index_equals
    title: 'Array index path: first tag equals beta'
    where:
      metadata_match:
        path:
          - tags
          - '0'
        equals: beta
    expect_ids:
      - u1
      - u3
      - u5
      - u7
  - id: json_match_036_array_index_type_sensitive
    title: "Array index path is type-sensitive: first tag equals string '0'"
    where:
      metadata_match:
        path:
          - tags
          - '0'
        equals: '0'
    expect_ids:
      - u8
  - id: json_match_037_nested_array_object_null
    title: Nested array object path equals JSON null
    where:
      metadata_match:
        path:
          - addresses
          - '0'
          - city
        equals: null
    expect_ids:
      - u5
  - id: json_match_038_nested_array_second_item
    title: 'Nested array path: second address city equals Berlin'
    where:
      metadata_match:
        path:
          - addresses
          - '1'
          - city
        equals: Berlin
    expect_ids:
      - u6
  - id: json_match_039_nested_array_missing_index
    title: Missing array index path
    where:
      metadata_match:
        path:
          - addresses
          - '0'
          - city
        exists: false
    expect_ids:
      - u3
      - u4
      - u9
  - id: json_match_040_or_across_two_array_indexes
    title: OR across first and second address indexes
    where:
      OR:
        - metadata_match:
            path:
              - addresses
              - '0'
              - city
            equals: Berlin
        - metadata_match:
            path:
              - addresses
              - '1'
              - city
            equals: Berlin
    expect_ids:
      - u1
      - u6
  - id: json_match_041_boolean_true
    title: equals boolean true
    where:
      metadata_match:
        path:
          - flags
          - emailVerified
        equals: true
    expect_ids:
      - u1
  - id: json_match_042_boolean_false
    title: equals boolean false
    where:
      metadata_match:
        path:
          - flags
          - emailVerified
        equals: false
    expect_ids:
      - u2
  - id: json_match_043_boolean_missing
    title: 'exists: false for a boolean path'
    where:
      metadata_match:
        path:
          - flags
          - emailVerified
        exists: false
    expect_ids:
      - u3
      - u4
      - u5
      - u6
      - u7
      - u8
      - u9
  - id: json_match_044_in_operator
    title: in on a scalar path
    where:
      metadata_match:
        path:
          - profile
          - country
        in:
          - DE
          - FR
    expect_ids:
      - u1
      - u2
      - u3
      - u7
      - u8
  - id: json_match_045_not_in_negative_semantics
    title: not_in includes missing path and root field null
    where:
      metadata_match:
        path:
          - profile
          - country
        not_in:
          - DE
          - FR
    expect_ids:
      - u4
      - u5
      - u6
      - u9
  - id: json_match_046_not_in_existing_only
    title: 'existing-only not_in is expressed with AND + exists: true'
    where:
      AND:
        - metadata_match:
            path:
              - profile
              - country
            exists: true
        - metadata_match:
            path:
              - profile
              - country
            not_in:
              - DE
              - FR
    expect_ids:
      - u5
      - u6
  - id: json_match_047_impossible_and
    title: Contradictory AND returns no records
    where:
      AND:
        - metadata_match:
            path:
              - profile
              - country
            equals: DE
        - metadata_match:
            path:
              - profile
              - country
            equals: US
    expect_ids: []
  - id: json_match_048_whole_json_equals_null
    title: 'path omitted: whole JSON field equals null'
    where:
      metadata_match:
        equals: null
    expect_ids:
      - u9
  - id: json_match_049_whole_json_exists_false
    title: 'path omitted: whole JSON field exists false'
    where:
      metadata_match:
        exists: false
    expect_ids:
      - u9
  - id: json_match_050_whole_json_not_null
    title: 'path omitted: whole JSON field is not null'
    where:
      metadata_match:
        not: null
    expect_ids:
      - u1
      - u2
      - u3
      - u4
      - u5
      - u6
      - u7
      - u8
  - id: json_match_051_whole_field_equals_null
    title: 'whole-field exact filter: metadata equals null'
    where:
      metadata: null
    expect_ids:
      - u9
  - id: json_match_052_whole_field_not_null
    title: 'whole-field exact filter: metadata_not null'
    where:
      metadata_not: null
    expect_ids:
      - u1
      - u2
      - u3
      - u4
      - u5
      - u6
      - u7
      - u8
  - id: json_match_053_empty_array_equals
    title: equals on an empty array
    where:
      metadata_match:
        path:
          - misc
          - emptyArray
        equals: []
    expect_ids:
      - u5
  - id: json_match_054_empty_object_equals
    title: equals on an empty object
    where:
      metadata_match:
        path:
          - misc
          - emptyObject
        equals: {}
    expect_ids:
      - u5
  - id: json_match_055_string_operator_on_number_returns_false
    title: string_contains on a numeric path returns false
    where:
      metadata_match:
        path:
          - profile
          - age
        string_contains: '2'
    expect_ids: []
  - id: json_match_056_array_contains_on_scalar_returns_false
    title: array_contains on a scalar path returns false
    where:
      metadata_match:
        path:
          - score
        array_contains: 10
    expect_ids: []
  - id: json_match_057_array_not_contains_on_scalar_returns_true
    title: array_not_contains on a scalar path returns true because non-array values match negative array operator
    where:
      metadata_match:
        path:
          - score
        array_not_contains: 10
    expect_ids:
      - u1
      - u2
      - u3
      - u4
      - u5
      - u6
      - u7
      - u8
      - u9
  - id: json_match_058_complex_business_filter
    title: 'Complex business filter: adult DE/FR user with beta or paid tag and non-spam email'
    where:
      AND:
        - OR:
            - metadata_match:
                path:
                  - profile
                  - country
                equals: DE
            - metadata_match:
                path:
                  - profile
                  - country
                equals: FR
        - metadata_match:
            path:
              - profile
              - age
            number_gte: 18
        - OR:
            - metadata_match:
                path:
                  - tags
                array_contains: beta
            - metadata_match:
                path:
                  - tags
                array_contains: paid
        - metadata_match:
            path:
              - profile
              - email
            string_not_contains: spam
    expect_ids:
      - u1
      - u3
      - u7
  - id: json_match_059_complex_missing_or_null_logic
    title: 'Complex missing-or-null logic: company is missing or country is null, and email exists and ends with .com'
    where:
      AND:
        - OR:
            - metadata_match:
                path:
                  - profile
                  - company
                  - tier
                exists: false
            - metadata_match:
                path:
                  - profile
                  - country
                equals: null
        - metadata_match:
            path:
              - profile
              - email
            exists: true
        - metadata_match:
            path:
              - profile
              - email
            string_ends_with: .com
    expect_ids:
      - u1
      - u4
      - u5
      - u6
      - u8
```

# Invalid input test cases

```yaml
invalid_tests:
  - id: json_match_invalid_001_empty_path
    title: path cannot be an empty array
    where:
      metadata_match:
        path: []
        equals: DE
    expect_error:
      code: BAD_USER_INPUT
      message_contains: JSON path cannot be empty
  - id: json_match_invalid_002_dot_inside_segment
    title: path segment cannot contain a dot
    where:
      metadata_match:
        path:
          - profile.country
        equals: DE
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_003_jsonpath_string_segment
    title: JSONPath string is not a valid path segment
    where:
      metadata_match:
        path:
          - $.profile.country
        equals: DE
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_004_forbidden_proto_key
    title: __proto__ is forbidden as a path segment
    where:
      metadata_match:
        path:
          - profile
          - __proto__
        equals: x
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_005_forbidden_constructor_key
    title: constructor is forbidden as a path segment
    where:
      metadata_match:
        path:
          - profile
          - constructor
        equals: x
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_006_forbidden_prototype_key
    title: prototype is forbidden as a path segment
    where:
      metadata_match:
        path:
          - profile
          - prototype
        equals: x
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_007_forbidden_typename_key
    title: __typename is forbidden as a path segment
    where:
      metadata_match:
        path:
          - profile
          - __typename
        equals: x
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_008_wildcard_segment
    title: wildcard path segment is forbidden
    where:
      metadata_match:
        path:
          - profile
          - '*'
          - country
        equals: DE
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_009_index_too_large
    title: array index cannot exceed the allowed segment limit
    where:
      metadata_match:
        path:
          - addresses
          - '10000'
          - city
        equals: Berlin
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_010_negative_index
    title: negative array indexes are forbidden
    where:
      metadata_match:
        path:
          - addresses
          - '-1'
          - city
        equals: Berlin
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Invalid JSON path segment
  - id: json_match_invalid_011_path_not_allowlisted
    title: syntactically valid path that is not in allowedPaths
    where:
      metadata_match:
        path:
          - profile
          - secretToken
        equals: abc
    expect_error:
      code: BAD_USER_INPUT
      message_contains: is not allowed
  - id: json_match_invalid_012_multiple_conditions
    title: only one operator can be used in one JsonMatchInput
    where:
      metadata_match:
        path:
          - profile
          - country
        equals: DE
        exists: true
    expect_error:
      code: BAD_USER_INPUT
      message_contains: Only one condition can be used in JsonMatchInput
  - id: json_match_invalid_013_no_condition
    title: JsonMatchInput must contain one operator
    where:
      metadata_match:
        path:
          - profile
          - country
    expect_error:
      code: BAD_USER_INPUT
      message_contains: One condition is required in JsonMatchInput
  - id: json_match_invalid_014_empty_in
    title: in must be a non-empty array
    where:
      metadata_match:
        path:
          - profile
          - country
        in: []
    expect_error:
      code: BAD_USER_INPUT
      message_contains: in must be a non-empty array
  - id: json_match_invalid_015_empty_not_in
    title: not_in must be a non-empty array
    where:
      metadata_match:
        path:
          - profile
          - country
        not_in: []
    expect_error:
      code: BAD_USER_INPUT
      message_contains: not_in must be a non-empty array
  - id: json_match_invalid_016_empty_whole_field_in
    title: metadata_in must be a non-empty array
    where:
      metadata_in: []
    expect_error:
      code: BAD_USER_INPUT
      message_contains: metadata_in must be a non-empty array
  - id: json_match_invalid_017_empty_whole_field_not_in
    title: metadata_not_in must be a non-empty array
    where:
      metadata_not_in: []
    expect_error:
      code: BAD_USER_INPUT
      message_contains: metadata_not_in must be a non-empty array
  - id: json_match_invalid_018_is_null_not_supported
    title: is_null is not part of JsonMatchInput
    where:
      metadata_match:
        path:
          - profile
          - middleName
        is_null: true
    expect_error:
      code: GRAPHQL_VALIDATION_FAILED
      message_contains: Field "is_null" is not defined by type "JsonMatchInput"
  - id: json_match_invalid_019_global_not_not_supported
    title: global NOT is not part of this JSON filter specification
    where:
      NOT:
        - metadata_match:
            path:
              - profile
              - country
            equals: DE
    expect_error:
      code: GRAPHQL_VALIDATION_FAILED
      message_contains: Field "NOT" is not defined by type
  - id: json_match_invalid_020_null_inside_path_array
    title: 'path: [String!] does not allow null inside the array'
    where:
      metadata_match:
        path:
          - profile
          - null
        equals: DE
    expect_error:
      code: GRAPHQL_VALIDATION_FAILED
      message_contains: Expected non-nullable type String
  - id: json_match_invalid_021_non_string_path_segment
    title: 'path: [String!] does not allow a number as a segment'
    where:
      metadata_match:
        path:
          - addresses
          - 0
          - city
        equals: Berlin
    expect_error:
      code: GRAPHQL_VALIDATION_FAILED
      message_contains: String
```

# Semantic comparison tests

These tests compare forms that are equivalent or intentionally different under the `json.md` contract.

```yaml
semantic_tests:
  - id: json_match_semantic_001_root_null_forms_are_equivalent
    title: 'metadata: null, metadata_match exists:false, and metadata_match equals:null are equivalent for root field null'
    left:
      metadata: null
    right:
      metadata_match:
        exists: false
    expect_equal_ids: true
    expect_ids:
      - u9
  - id: json_match_semantic_002_root_null_exists_false_equals_null_equivalent
    title: metadata_match exists:false and metadata_match equals:null are equivalent when path is omitted
    left:
      metadata_match:
        exists: false
    right:
      metadata_match:
        equals: null
    expect_equal_ids: true
    expect_ids:
      - u9
  - id: json_match_semantic_003_root_not_null_field_filter_vs_exists_true
    title: metadata_not:null and metadata_match exists:true are equivalent for root field not null
    left:
      metadata_not: null
    right:
      metadata_match:
        exists: true
    expect_equal_ids: true
    expect_ids:
      - u1
      - u2
      - u3
      - u4
      - u5
      - u6
      - u7
      - u8
  - id: json_match_semantic_004_root_not_null_exists_true_vs_not_null
    title: metadata_match exists:true and metadata_match not:null are equivalent when path is omitted
    left:
      metadata_match:
        exists: true
    right:
      metadata_match:
        not: null
    expect_equal_ids: true
    expect_ids:
      - u1
      - u2
      - u3
      - u4
      - u5
      - u6
      - u7
      - u8
  - id: json_match_semantic_005_nested_null_is_not_missing
    title: nested equals:null is not equivalent to exists:false
    left:
      metadata_match:
        path:
          - profile
          - middleName
        equals: null
    right:
      metadata_match:
        path:
          - profile
          - middleName
        exists: false
    expect_equal_ids: false
    left_expect_ids:
      - u1
      - u4
    right_expect_ids:
      - u2
      - u3
      - u5
      - u6
      - u7
      - u8
      - u9
  - id: json_match_semantic_006_not_vs_existing_only_not
    title: not includes missing path and root null unless paired with exists:true
    left:
      metadata_match:
        path:
          - profile
          - country
        not: DE
    right:
      AND:
        - metadata_match:
            path:
              - profile
              - country
            exists: true
        - metadata_match:
            path:
              - profile
              - country
            not: DE
    expect_equal_ids: false
    left_expect_ids:
      - u3
      - u4
      - u5
      - u6
      - u9
    right_expect_ids:
      - u3
      - u5
      - u6
  - id: json_match_semantic_007_not_in_vs_existing_only_not_in
    title: not_in includes missing path and root null unless paired with exists:true
    left:
      metadata_match:
        path:
          - profile
          - country
        not_in:
          - DE
          - FR
    right:
      AND:
        - metadata_match:
            path:
              - profile
              - country
            exists: true
        - metadata_match:
            path:
              - profile
              - country
            not_in:
              - DE
              - FR
    expect_equal_ids: false
    left_expect_ids:
      - u4
      - u5
      - u6
      - u9
    right_expect_ids:
      - u5
      - u6
  - id: json_match_semantic_008_string_not_contains_vs_existing_only
    title: string_not_contains includes missing path and root null unless paired with exists:true
    left:
      metadata_match:
        path:
          - profile
          - email
        string_not_contains: example.com
    right:
      AND:
        - metadata_match:
            path:
              - profile
              - email
            exists: true
        - metadata_match:
            path:
              - profile
              - email
            string_not_contains: example.com
    expect_equal_ids: false
    left_expect_ids:
      - u2
      - u3
      - u7
      - u9
    right_expect_ids:
      - u2
      - u3
      - u7
  - id: json_match_semantic_009_array_not_contains_vs_existing_only
    title: array_not_contains includes missing path and root null unless paired with exists:true
    left:
      metadata_match:
        path:
          - tags
        array_not_contains: beta
    right:
      AND:
        - metadata_match:
            path:
              - tags
            exists: true
        - metadata_match:
            path:
              - tags
            array_not_contains: beta
    expect_equal_ids: false
    left_expect_ids:
      - u2
      - u4
      - u6
      - u8
      - u9
    right_expect_ids:
      - u2
      - u4
      - u6
      - u8
```
