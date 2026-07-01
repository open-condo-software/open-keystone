# JSON field filters specification

## Goal

Add a unified and predictable set of filters for `JSON` fields to the GraphQL API.

Filters should be:

1. portable between adapters;
2. safe from path injection;
3. similar in form to Prisma JSON filters;
4. simple enough to be implemented identically in PostgreSQL, MongoDB, MySQL, SQLite and other adapters;
5. clear to developers regarding `null`, empty object, empty array, and nullable JSON field.

## Main decisions

1. Any `JSON` field in the GraphQL API is always nullable.
2. A `JSON` field cannot be required.
3. If `null` is passed to a `JSON` field, the entire field is set to `null`.
4. The API does not distinguish between root-level JSON `null` and the field's `null`.
5. A nested JSON `null` inside an object or array is a regular JSON value.
6. `{}` and `[]` are regular JSON values and are not automatically removed.
7. No normalization of JSON values is performed.
8. `path` is an array of safe tokens, not a JSONPath string.

## GraphQL schema

Standard exact-match filters are generated for each `JSON` field:

```graphql
{field}: JSON
{field}_not: JSON
{field}_in: [JSON!]
{field}_not_in: [JSON!]
```

And one JSON-specific filter:

```graphql
{field}_match: JsonMatchInput
```

For example, for the `metadata` field:

```graphql
metadata: JSON
metadata_not: JSON
metadata_in: [JSON!]
metadata_not_in: [JSON!]
metadata_match: JsonMatchInput
```

Input:

```graphql
input JsonMatchInput {
  path: [String!]

  equals: JSON
  not: JSON

  in: [JSON!]
  not_in: [JSON!]

  exists: Boolean

  lt: Float
  lte: Float
  gt: Float
  gte: Float

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

`JsonMatchInput` does not contain `is_null`.

To check for `null`, use `equals: null` or the field's standard exact-match filter.

## Nullable JSON field

A `JSON` field is always nullable.

This means the field has a state:

```json
{
  "metadata": null
}
```

This state is called `field null`.

`field null` means there is no JSON document in the field.

On create, if no field value is passed and there is no default value, the field becomes `null`.

On update:

1. if the field is not passed, the field value does not change;
2. if the field is passed as `null`, the entire field becomes `null`;
3. if the field is passed as `{}`, the entire field becomes an empty object;
4. if the field is passed as `[]`, the entire field becomes an empty array;
5. if the field is passed as an object/array/scalar, the value is saved as is.

Example:

```graphql
mutation {
  updateUser(id: "1", data: { metadata: null }) {
    id
  }
}
```

Means:

```ts
metadata = null;
```

And not:

```ts
metadata = JSON null value inside existing document
```

## Root null vs nested null

The API has two different practical cases.

### Root null

Root null is the `null` of the entire field.

```json
{
  "metadata": null
}
```

Root null is searched as follows:

```graphql
where: {
  metadata: null
}
```

or like this:

```graphql
where: {
  metadata_match: {
    exists: false
  }
}
```

or like this:

```graphql
where: {
  metadata_match: {
    equals: null
  }
}
```

All three options mean:

```ts
metadata === null;
```

### Nested JSON null

Nested JSON null is a `null` inside a JSON document.

```json
{
  "metadata": {
    "profile": {
      "middleName": null
    }
  }
}
```

Nested JSON null is searched only via `path`:

```graphql
where: {
  metadata_match: {
    path: ["profile", "middleName"]
    equals: null
  }
}
```

For such a value:

```graphql
metadata_match: {
  path: ["profile", "middleName"]
  exists: true
}
```

also matches.

But:

```graphql
metadata_match: {
  path: ["profile", "middleName"]
  exists: false
}
```

does not match.

## Missing path

`missing path` means that the path cannot be resolved within the JSON document.

Examples of missing path:

```ts
metadata.profile.country; // key is missing
metadata.tags[10]; // index is missing
metadata.profile.age.x; // age is a number, cannot go further
```

If the field itself is `null`, any nested path is considered missing.

For such a value:

```json
{
  "metadata": null
}
```

this filter matches:

```graphql
metadata_match: {
  path: ["profile", "country"]
  exists: false
}
```

and this one does not match:

```graphql
metadata_match: {
  path: ["profile", "country"]
  exists: true
}
```

## Empty object and empty array

`{}` and `[]` are regular JSON values.

They are not automatically removed and are not considered missing.

```json
{
  "metadata": {}
}
```

For such a value:

```graphql
metadata_match: {
  exists: true
}
```

matches.

```graphql
metadata_match: {
  exists: false
}
```

does not match.

```graphql
metadata_match: {
  equals: {}
}
```

matches.

Similarly for root array:

```json
{
  "metadata": []
}
```

```graphql
metadata_match: {
  exists: true
}
```

matches.

```graphql
metadata_match: {
  equals: []
}
```

matches.

## Whole-field filters

Standard filters `{field}`, `{field}_not`, `{field}_in`, `{field}_not_in` work with the entire value of the field.

### `{field}`

```graphql
where: {
  metadata: null
}
```

Means:

```ts
metadata === null;
```

```graphql
where: {
  metadata: {
    profile: {
      country: "DE"
    }
  }
}
```

Means:

```ts
deepEqual(metadata, { profile: { country: 'DE' } });
```

### `{field}_not`

```graphql
where: {
  metadata_not: null
}
```

Means:

```ts
metadata !== null;
```

```graphql
where: {
  metadata_not: {
    profile: {
      country: "DE"
    }
  }
}
```

Means:

```ts
metadata === null || !deepEqual(metadata, { profile: { country: 'DE' } });
```

### `{field}_in`

```graphql
where: {
  metadata_in: [
    { profile: { country: "DE" } },
    { profile: { country: "FR" } }
  ]
}
```

Means:

```ts
metadata !== null && values.some(value => deepEqual(metadata, value));
```

`{field}_in` must be a non-empty array.

Due to the type `[JSON!]`, the list cannot contain `null`.

If you need to find `null` or one of the JSON values, use `OR`:

```graphql
OR: [
  { metadata: null },
  { metadata_in: [{ profile: { country: "DE" } }] }
]
```

### `{field}_not_in`

```graphql
where: {
  metadata_not_in: [
    { profile: { country: "DE" } },
    { profile: { country: "FR" } }
  ]
}
```

Means:

```ts
metadata === null || values.every(value => !deepEqual(metadata, value));
```

`{field}_not_in` must be a non-empty array.

Due to the type `[JSON!]`, the list cannot contain `null`.

If you need to exclude `null`, use an additional condition:

```graphql
AND: [
  { metadata_not: null },
  { metadata_not_in: [{ profile: { country: "DE" } }] }
]
```

## General JsonMatchInput semantics

Exactly one operator must be passed in a single `JsonMatchInput`.

`path` is not considered an operator.

Operators:

```yaml
- equals
- not
- in
- not_in
- exists
- lt
- lte
- gt
- gte
- string_contains
- string_not_contains
- string_starts_with
- string_not_starts_with
- string_ends_with
- string_not_ends_with
- array_contains
- array_not_contains
```

Valid:

```graphql
metadata_match: {
  path: ["profile", "country"]
  equals: "DE"
}
```

Invalid:

```graphql
metadata_match: {
  path: ["profile", "country"]
  equals: "DE"
  exists: true
}
```

Invalid:

```graphql
metadata_match: {
  path: ["profile", "country"]
}
```

Important: the check for "whether an operator is passed" should consider the presence of the key, not the truthy/falsy value.

These values are valid conditions:

```graphql
equals: null
equals: false
equals: 0
equals: ""
equals: {}
equals: []
exists: false
array_contains: null
array_contains: {}
array_contains: []
array_not_contains: null
array_not_contains: {}
array_not_contains: []
```

## Path

`path` points to a value inside a JSON field.

If `path` is not passed, the operator is applied to the entire JSON field.

```graphql
metadata_match: {
  equals: {
    source: "crm"
  }
}
```

If `path` is passed, the operator is applied to the value at that path.

```graphql
metadata_match: {
  path: ["profile", "country"]
  equals: "DE"
}
```

`path` is an array of tokens, not a JSONPath, SQL expression, MongoDB expression, or a dot-separated string.

Correct:

```ts
['profile', 'country'][('profile', 'age')][('addresses', '0', 'city')][('tags', '1')];
```

Incorrect:

```ts
['profile.country']['$.profile.country'][('profile', '*', 'country')][('profile', '__proto__')][
  ('profile', 'constructor')
][('profile', '__typename')];
```

## Path segment rules

A path segment can be an object key or an array index.

Object key:

```ts
const JSON_PATH_KEY_SEGMENT_REGEX =
  /^(?!(?:__proto__|prototype|constructor|__typename)$)[_A-Za-z][_A-Za-z0-9]*$/;
```

Array index:

```ts
const JSON_PATH_INDEX_SEGMENT_REGEX = /^(?:0|[1-9][0-9]{0,3})$/;
```

General segment validator:

```ts
function isValidJsonPathSegment(segment: string) {
  return JSON_PATH_KEY_SEGMENT_REGEX.test(segment) || JSON_PATH_INDEX_SEGMENT_REGEX.test(segment);
}
```

Rules:

1. an object key can contain only ASCII letters, digits, and `_`;
2. an object key must start with a letter or `_`;
3. `__proto__`, `prototype`, `constructor`, `__typename` are forbidden;
4. an array index is written as a string: `"0"`, `"1"`, `"12"`;
5. negative indices are forbidden;
6. wildcards are forbidden;
7. recursive search is forbidden;
8. JSONPath filters are forbidden;
9. a numeric segment is considered an array index;
10. object keys like `"0"` are not supported as queryable path keys.

## allowedPaths

An allow-list of permitted paths can be specified for each `JSON` field.

```ts
metadata: {
  type: Json,
  allowedPaths: [
    ["profile", "country"],
    ["profile", "age"],
    ["profile", "email"],
    ["tags"],
    ["tags", "0"],
    ["addresses", "0", "city"],
  ],
}
```

If `path` is passed, it must:

1. be a non-empty array;
2. consist only of valid path segments;
3. exactly match one of the paths in `allowedPaths`.

If a path is syntactically valid but is not in `allowedPaths`, the request should fail with a user input error.

```text
JSON path "profile.secretToken" is not allowed for User.metadata
```

If `path` is not passed, the filter is applied to the entire JSON field and does not require an allow-list path.

## Operator semantics

### `exists`

Checks for the existence of a value.

Without `path`:

```graphql
metadata_match: {
  exists: true
}
```

Means:

```ts
metadata !== null;
```

```graphql
metadata_match: {
  exists: false
}
```

Means:

```ts
metadata === null;
```

With `path`:

```graphql
metadata_match: {
  path: ["profile", "country"]
  exists: true
}
```

Means:

```ts
metadata !== null && path exists
```

```graphql
metadata_match: {
  path: ["profile", "country"]
  exists: false
}
```

Means:

```ts
metadata === null || path is missing
```

`null`, `{}` and `[]` inside a JSON document are considered existing values.

### `equals`

Matches if the selected value exists and is deep-equal to the passed JSON value.

Without `path`:

```graphql
metadata_match: {
  equals: null
}
```

Means:

```ts
metadata === null;
```

```graphql
metadata_match: {
  equals: {}
}
```

Means:

```ts
deepEqual(metadata, {});
```

With `path`:

```graphql
metadata_match: {
  path: ["profile", "country"]
  equals: "DE"
}
```

Means:

```ts
metadata !== null && path exists && deepEqual(value, expected)
```

Any JSON values are allowed:

```graphql
equals: null
equals: {}
equals: []
equals: false
equals: 0
equals: ""
```

Equality is type-sensitive:

```ts
10 !== "10"
false !== 0
null !== missing
[] !== {}
```

Object key order does not affect equality.

Array order affects equality.

### `not`

Matches if the selected value is missing or not equal to the passed JSON value.

Without `path`:

```graphql
metadata_match: {
  not: null
}
```

Means:

```ts
metadata !== null;
```

With `path`:

```graphql
metadata_match: {
  path: ["profile", "country"]
  not: "DE"
}
```

Means:

```ts
metadata === null || path is missing || !deepEqual(value, expected)
```

If you need to apply `not` only to existing values, use `AND` with `exists: true`.

```graphql
AND: [
  {
    metadata_match: {
      path: ["profile", "country"]
      not: "DE"
    }
  },
  {
    metadata_match: {
      path: ["profile", "country"]
      exists: true
    }
  }
]
```

### `in`

Matches if the selected value exists and is equal to one of the values in the list.

```graphql
metadata_match: {
  path: ["profile", "country"]
  in: ["DE", "FR"]
}
```

```ts
metadata !== null && path exists && values.some(item => deepEqual(value, item))
```

If `path` is not passed:

```ts
metadata !== null && values.some(item => deepEqual(metadata, item));
```

`in` must be a non-empty array.

Due to the type `[JSON!]`, the `in` list cannot contain `null`.

If you need to check for `null` along with other values, use `OR`.

For root null:

```graphql
OR: [
  { metadata: null },
  { metadata_match: { in: [{ source: "crm" }] } }
]
```

For nested null:

```graphql
OR: [
  {
    metadata_match: {
      path: ["profile", "country"]
      equals: null
    }
  },
  {
    metadata_match: {
      path: ["profile", "country"]
      in: ["DE", "FR"]
    }
  }
]
```

### `not_in`

Matches if the selected value is missing or not equal to any value in the list.

```graphql
metadata_match: {
  path: ["profile", "country"]
  not_in: ["DE", "FR"]
}
```

```ts
metadata === null || path is missing || values.every(item => !deepEqual(value, item))
```

If `path` is not passed:

```ts
metadata === null || values.every(item => !deepEqual(metadata, item));
```

`not_in` must be a non-empty array.

Due to the type `[JSON!]`, the `not_in` list cannot contain `null`.

If you need to apply `not_in` only to existing values, use `AND` with `exists: true`.

```graphql
AND: [
  {
    metadata_match: {
      path: ["profile", "country"]
      not_in: ["DE", "FR"]
    }
  },
  {
    metadata_match: {
      path: ["profile", "country"]
      exists: true
    }
  }
]
```

### `lt`, `lte`, `gt`, `gte`

Numeric operators are applied only to existing JSON number values.

```graphql
metadata_match: {
  path: ["profile", "age"]
  gte: 18
}
```

```ts
metadata !== null && path exists && typeof value === "number" && value >= expected
```

If `path` is not passed:

```ts
metadata !== null && typeof metadata === 'number' && metadata >= expected;
```

If the value is missing, `null`, string, boolean, object, or array, the condition does not match.

```ts
'18'; // not a number
null; // not a number
{
} // not a number
[]; // not a number
```

### `string_contains`

Matches if the selected value exists, is a string, and contains the substring.

```graphql
metadata_match: {
  path: ["profile", "email"]
  string_contains: "example.com"
}
```

```ts
metadata !== null && path exists && typeof value === "string" && value.includes(expected)
```

If `path` is not passed:

```ts
metadata !== null && typeof metadata === 'string' && metadata.includes(expected);
```

### `string_not_contains`

Matches if the selected value is missing, is not a string, or the string does not contain the substring.

```graphql
metadata_match: {
  path: ["profile", "email"]
  string_not_contains: "spam"
}
```

```ts
metadata === null || path is missing || typeof value !== "string" || !value.includes(expected)
```

If `path` is not passed:

```ts
metadata === null || typeof metadata !== 'string' || !metadata.includes(expected);
```

### `string_starts_with`

Matches if the selected value exists, is a string, and starts with the passed string.

```graphql
metadata_match: {
  path: ["profile", "email"]
  string_starts_with: "admin"
}
```

```ts
metadata !== null && path exists && typeof value === "string" && value.startsWith(expected)
```

### `string_not_starts_with`

Matches if the selected value is missing, is not a string, or the string does not start with the passed string.

```graphql
metadata_match: {
  path: ["profile", "email"]
  string_not_starts_with: "admin"
}
```

```ts
metadata === null || path is missing || typeof value !== "string" || !value.startsWith(expected)
```

### `string_ends_with`

Matches if the selected value exists, is a string, and ends with the passed string.

```graphql
metadata_match: {
  path: ["profile", "email"]
  string_ends_with: ".com"
}
```

```ts
metadata !== null && path exists && typeof value === "string" && value.endsWith(expected)
```

### `string_not_ends_with`

Matches if the selected value is missing, is not a string, or the string does not end with the passed string.

```graphql
metadata_match: {
  path: ["profile", "email"]
  string_not_ends_with: ".ru"
}
```

```ts
metadata === null || path is missing || typeof value !== "string" || !value.endsWith(expected)
```

### String matching rules

String filters are case-sensitive.

```ts
'Alex'.includes('A') === true;
'Alex'.includes('a') === false;
```

Case-insensitive mode is not supported in this version of the API.

### `array_contains`

Matches if the selected value exists, is an array, and the array contains an element deep-equal to the passed JSON value.

```graphql
metadata_match: {
  path: ["tags"]
  array_contains: "beta"
}
```

```ts
metadata !== null
  && path exists
  && Array.isArray(value)
  && value.some(item => deepEqual(item, expected))
```

If `path` is not passed:

```ts
metadata !== null && Array.isArray(metadata) && metadata.some(item => deepEqual(item, expected));
```

Any JSON values are allowed:

```graphql
array_contains: null
array_contains: {}
array_contains: []
array_contains: false
array_contains: 0
array_contains: "beta"
array_contains: { code: "x" }
```

An object value inside the array is compared via deep equality.

```json
{ "code": "x" }
```

matches the element:

```json
{ "code": "x" }
```

but does not match the element:

```json
{ "code": "x", "extra": true }
```

### `array_not_contains`

Matches if the selected value is missing, is not an array, or the array does not contain an element deep-equal to the passed JSON value.

```graphql
metadata_match: {
  path: ["tags"]
  array_not_contains: "beta"
}
```

```ts
metadata === null
  || path is missing
  || !Array.isArray(value)
  || value.every(item => !deepEqual(item, expected))
```

If `path` is not passed:

```ts
metadata === null || !Array.isArray(metadata) || metadata.every(item => !deepEqual(item, expected));
```

If you need to apply `array_not_contains` only to existing arrays, use `AND` with `exists: true`.

```graphql
AND: [
  {
    metadata_match: {
      path: ["tags"]
      array_not_contains: "beta"
    }
  },
  {
    metadata_match: {
      path: ["tags"]
      exists: true
    }
  }
]
```

## Positive and negative operators

Positive operators require an existing value of a suitable type.

Positive operators:

```yaml
- equals
- in
- exists: true
- lt
- lte
- gt
- gte
- string_contains
- string_starts_with
- string_ends_with
- array_contains
```

Negative operators include missing path and root null.

Negative operators:

```yaml
- not
- not_in
- exists: false
- string_not_contains
- string_not_starts_with
- string_not_ends_with
- array_not_contains
```

Example:

```graphql
metadata_match: {
  path: ["profile", "country"]
  not: "DE"
}
```

means:

```ts
metadata === null || country is missing || country !== "DE"
```

If missing path and root null need to be excluded:

```graphql
AND: [
  {
    metadata_match: {
      path: ["profile", "country"]
      not: "DE"
    }
  },
  {
    metadata_match: {
      path: ["profile", "country"]
      exists: true
    }
  }
]
```

## AND / OR

Multiple conditions are combined using standard `AND` / `OR` in the parent `WhereInput`.

```graphql
AND: [
  {
    metadata_match: {
      path: ["profile", "country"]
      equals: "DE"
    }
  },
  {
    metadata_match: {
      path: ["profile", "age"]
      gte: 18
    }
  }
]
```

```graphql
OR: [
  {
    metadata_match: {
      path: ["profile", "country"]
      equals: "DE"
    }
  },
  {
    metadata_match: {
      path: ["profile", "country"]
      equals: "FR"
    }
  }
]
```

`NOT` is not included in this specification.

To negate individual JSON conditions, use explicit negative operators:

```graphql
not
not_in
string_not_contains
string_not_starts_with
string_not_ends_with
array_not_contains
exists: false
```

## Validation rules

### JSON field configuration

A `JSON` field is always nullable.

If a developer attempts to declare a `JSON` field as required, the schema should fail with a configuration error.

```text
JSON field "metadata" cannot be required. JSON fields are always nullable.
```

### Exactly one operator

Exactly one operator must be passed.

`path` is not considered an operator.

You cannot pass multiple operators:

```graphql
metadata_match: {
  path: ["profile", "age"]
  gte: 18
  lt: 65
}
```

You must use `AND`:

```graphql
AND: [
  {
    metadata_match: {
      path: ["profile", "age"]
      gte: 18
    }
  },
  {
    metadata_match: {
      path: ["profile", "age"]
      lt: 65
    }
  }
]
```

### Operator value validation

`exists` must be a boolean.

```graphql
exists: true
exists: false
```

`lt`, `lte`, `gt`, `gte` must be numbers.

`string_*` must be strings.

`in`, `not_in`, `{field}_in`, `{field}_not_in` must be non-empty arrays.

`equals`, `not`, `array_contains`, `array_not_contains` accept any JSON value, including:

```yaml
- null
- {}
- []
- string
- number
- boolean
- object
- array
```

### Invalid examples

An empty `path` cannot be passed:

```graphql
metadata_match: {
  path: []
  equals: "DE"
}
```

A forbidden path cannot be passed:

```graphql
metadata_match: {
  path: ["profile", "secretToken"]
  equals: "abc"
}
```

An empty `in` cannot be passed:

```graphql
metadata_match: {
  path: ["profile", "country"]
  in: []
}
```

An empty `not_in` cannot be passed:

```graphql
metadata_match: {
  path: ["profile", "country"]
  not_in: []
}
```

An empty `{field}_in` cannot be passed:

```graphql
where: {
  metadata_in: []
}
```

An empty `{field}_not_in` cannot be passed:

```graphql
where: {
  metadata_not_in: []
}
```

## Write semantics

JSON values are saved without normalization.

If the client writes:

```json
{
  "profile": {
    "country": "DE",
    "middleName": null
  },
  "settings": {},
  "tags": []
}
```

then these values should remain in the JSON.

The API should not automatically remove:

```yaml
- nested null
- empty object
- empty array
```

Therefore, filters must distinguish between:

```yaml
field null
missing path
nested explicit null
empty object
empty array
```

Root-level `null` is an exception.

If the client writes:

```graphql
metadata: null
```

then this means `field null`.

The API does not provide a separate way to write a root-level JSON `null` distinct from `field null`.

## Adapter requirements

Adapters must receive an already validated `path`.

Adapters should not concatenate the user-provided `path` into a raw query.

Adapters must:

1. check the `path` against a regex;
2. check the `path` against `allowedPaths`;
3. translate path tokens into the native database mechanism;
4. pass filter values as parameters;
5. preserve type-sensitive semantics;
6. preserve the distinction between field null, missing path, and nested JSON null;
7. preserve the distinction between scalar, object, and array;
8. maintain identical behavior for negative operators;
9. not create a root-level JSON `null` distinct from field null.

If the database or driver distinguishes between database `NULL` and root JSON `null`, the adapter must hide this difference at the GraphQL API level:

```yaml
GraphQL metadata: null
  means: API-level field null
  may map to: database NULL
  must not expose: separate root JSON null state
```

If the database already contains legacy data with root-level JSON `null`, the adapter must treat it as API-level field null when reading and filtering.

If the adapter cannot correctly implement an operator, it should explicitly return a support error rather than changing the semantics.

## Non-goals

This version of the API does not support:

```yaml
- JSONPath strings
- wildcard paths
- recursive descent
- filtering object key values inside arrays by predicate
- array_starts_with
- array_ends_with
- case-insensitive string mode
- partial JSON update
- database-specific JSON expressions
- raw SQL / Mongo expressions
- separate root JSON null distinct from field null
- required JSON fields
```

## Examples

### Find items where metadata is null

```graphql
query {
  allUsers(where: { metadata: null }) {
    id
  }
}
```

Equivalent:

```graphql
query {
  allUsers(where: { metadata_match: { exists: false } }) {
    id
  }
}
```

### Find items where metadata is not null

```graphql
query {
  allUsers(where: { metadata_not: null }) {
    id
  }
}
```

Equivalent:

```graphql
query {
  allUsers(where: { metadata_match: { exists: true } }) {
    id
  }
}
```

### Find users from Germany

```graphql
query {
  allUsers(where: { metadata_match: { path: ["profile", "country"], equals: "DE" } }) {
    id
  }
}
```

### Find users where country is missing

```graphql
query {
  allUsers(where: { metadata_match: { path: ["profile", "country"], exists: false } }) {
    id
  }
}
```

This also matches rows where `metadata` itself is `null`.

### Find users where country is explicitly null

```graphql
query {
  allUsers(where: { metadata_match: { path: ["profile", "country"], equals: null } }) {
    id
  }
}
```

This does not match rows where `metadata` is `null` or where `profile.country` is missing.

### Find adult users

```graphql
query {
  allUsers(where: { metadata_match: { path: ["profile", "age"], gte: 18 } }) {
    id
  }
}
```

### Find users with beta tag

```graphql
query {
  allUsers(where: { metadata_match: { path: ["tags"], array_contains: "beta" } }) {
    id
  }
}
```

### Find users without beta tag

```graphql
query {
  allUsers(where: { metadata_match: { path: ["tags"], array_not_contains: "beta" } }) {
    id
  }
}
```

This also matches users where `metadata` is `null`, `tags` is missing, or `tags` is not an array.

### Find users where tags exists and does not contain beta

```graphql
query {
  allUsers(
    where: {
      AND: [
        { metadata_match: { path: ["tags"], exists: true } }
        { metadata_match: { path: ["tags"], array_not_contains: "beta" } }
      ]
    }
  ) {
    id
  }
}
```

### Find users by complex condition

```graphql
query {
  allUsers(
    where: {
      AND: [
        {
          OR: [
            { metadata_match: { path: ["profile", "country"], equals: "DE" } }
            { metadata_match: { path: ["profile", "country"], equals: "FR" } }
          ]
        }
        { metadata_match: { path: ["profile", "age"], gte: 18 } }
        { metadata_match: { path: ["profile", "email"], string_not_contains: "spam" } }
        { metadata_match: { path: ["tags"], array_contains: "beta" } }
      ]
    }
  ) {
    id
  }
}
```

## Summary

Final contract:

```yaml
JsonField:
  nullable: true
  required: false
  root_null:
    graphql_input: metadata: null
    meaning: field null
    separate_json_root_null: not supported

JsonMatchInput:
  path:
    omitted: apply operator to whole JSON field
    provided: apply operator to selected JSON path
    format: array of safe path segments
    validation: regex + allowedPaths

  normalization:
    enabled: false

  field_null:
    means: whole JSON field is null
    metadata_match_exists_false: true
    metadata_match_equals_null_without_path: true
    nested_paths: missing

  nested_null:
    null_is_value: true
    null_is_not_missing: true
    filter_with: path + equals null

  empty_object:
    value_is_preserved: true
    exists: true
    can_be_filtered_with_equals: true

  empty_array:
    value_is_preserved: true
    exists: true
    can_be_filtered_with_equals: true

  positive_operators:
    missing_path_matches: false
    field_null_matches: false

  negative_operators:
    missing_path_matches: true
    field_null_matches: true

  array_contains:
    requires_existing_array: true
    comparison: deep equality against array element

  array_not_contains:
    missing_path_matches: true
    field_null_matches: true
    non_array_matches: true
    comparison: no deep-equal array element
```
