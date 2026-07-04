import isFunction from 'lodash.isfunction';
import { KnexFieldAdapter } from '@open-keystone/adapter-knex';
import { MongooseFieldAdapter } from '@open-keystone/adapter-mongoose';
import { PrismaFieldAdapter } from '@open-keystone/adapter-prisma';
import { escapeRegExp, escapeLike } from '@open-keystone/utils';
import { Implementation } from '../../Implementation';
import {
  normalizeJsonMatchInput,
  validateJsonFieldListFilter,
  validateJsonFieldValue,
  getRootFieldNullMatch,
  FIELD_NOT_NULL,
  FIELD_NULL,
} from './utils/validators';

const stringify = JSON.stringify;

const POSTGRES_JSONB_NULL = stringify(null);

const JsonMatchOperator = {
  EXISTS: 'exists',
  EQUALS: 'equals',
  IN: 'in',

  NUMBER_LT: 'number_lt',
  NUMBER_LTE: 'number_lte',
  NUMBER_GT: 'number_gt',
  NUMBER_GTE: 'number_gte',

  STRING_CONTAINS: 'string_contains',
  STRING_STARTS_WITH: 'string_starts_with',
  STRING_ENDS_WITH: 'string_ends_with',

  ARRAY_CONTAINS: 'array_contains',
};

function assertJsonFieldIsNullable(field) {
  if (field.config.knexOptions && field.config.knexOptions.isNotNullable) {
    throw new Error(
      `JSON field "${field.listKey}.${field.path}" cannot be not nullable. JSON fields are always nullable.`
    );
  }
}

const JSON_OBJECT_PATTERN_KEY_REGEX =
  /^(?!(?:__proto__|prototype|constructor|__typename)$)[_A-Za-z][_A-Za-z0-9]*$/;

export class Json extends Implementation {
  constructor(
    path,
    {
      isMultiline,
      graphQLInputType = 'JSON',
      graphQLReturnType = 'JSON',
      extendGraphQLTypes = [],
      graphQLAdminFragment = '',
    }
  ) {
    super(...arguments);

    assertJsonFieldIsNullable(this);

    this.isMultiline = isMultiline;
    this.isOrderable = false;
    this.graphQLInputType = graphQLInputType;
    this.graphQLReturnType = graphQLReturnType;
    this.extendGraphQLTypes = extendGraphQLTypes;
    this.graphQLAdminFragment = graphQLAdminFragment;
  }

  get _supportsUnique() {
    return false;
  }

  // GQL Output

  gqlOutputFields() {
    return [`${this.path}: ${this.graphQLReturnType}`];
  }

  gqlOutputFieldResolvers() {
    return {
      [`${this.path}`]: item => item[this.path],
    };
  }

  // GQL Input

  gqlQueryInputFields() {
    return [
      `${this.path}: ${this.graphQLInputType}`,
      `${this.path}_not: ${this.graphQLInputType}`,
      `${this.path}_in: [${this.graphQLInputType}]`,
      `${this.path}_not_in: [${this.graphQLInputType}]`,
      `${this.path}_match: JsonMatchInput`,
    ];
  }

  gqlUpdateInputFields() {
    return [`${this.path}: ${this.graphQLInputType}`];
  }

  gqlCreateInputFields() {
    return [`${this.path}: ${this.graphQLInputType}`];
  }

  // GQL Auxiliary

  /**
   * Auxiliary Types are top-level types which a type may need or provide.
   * Example: the `File` type, adds a graphql auxiliary type of `FileUpload`, as
   * well as an `uploadFile()` graphql auxiliary type query resolver
   */

  getGqlAuxTypes() {
    return [
      ...this.extendGraphQLTypes,
      `input JsonMatchInput {
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
}`,
    ];
  }

  gqlAuxFieldResolvers(args) {
    const { schemaName } = args;
    if (isFunction(this.config.gqlAuxFieldResolver)) {
      return this.config.gqlAuxFieldResolver(args);
    }

    return super.gqlAuxFieldResolvers({ schemaName });
  }

  // Admin

  extendAdminMeta(meta) {
    const { isMultiline } = this;
    return {
      isMultiline,
      graphQLAdminFragment: this.graphQLAdminFragment,
      ...meta,
    };
  }

  // Hooks

  async resolveInput({ resolvedData }) {
    if (!(this.path in resolvedData)) {
      return undefined;
    }
    return resolvedData[this.path];
  }

  validateMatchCondition(value) {
    return normalizeJsonMatchInput(value, {
      listKey: this.listKey,
      fieldPath: this.path,
      allowedPaths: this.config.allowedPaths,
      allowUnsafeLiteralObjectKeys: false,
      allowNullInLists: false, // JsonMatchInput.in is [JSON!]
    });
  }

  validateFieldFilterValue(value) {
    validateJsonFieldValue(value, {
      listKey: this.listKey,
      fieldPath: this.path,
      allowUnsafeLiteralObjectKeys: false,
    });
    return value;
  }

  validateFieldListFilterValue(value, operatorName) {
    validateJsonFieldListFilter(value, operatorName, {
      listKey: this.listKey,
      fieldPath: this.path,
      allowUnsafeLiteralObjectKeys: false,
      allowNullInLists: true, // {this.path}_in is [JSON]
    });
    return value;
  }
}

/**
 * JSON filter contract:
 *
 * 1. Root API null means the whole field is null. It intentionally hides
 *    adapter-specific differences between missing Mongo fields, SQL NULL,
 *    Postgres JSONB null and Prisma DbNull/JsonNull.
 * 2. Nested JSON null means an existing JSON path with a JSON null value.
 * 3. Negative nested operators must also match missing paths and root null.
 * 4. Root-level equals/in match operators are delegated to the regular field
 *    operators, so {field}_match preserves the same root semantics as {field},
 *    {field}_not, {field}_in and {field}_not_in.
 * 5. Adapter implementations may differ internally, but must preserve this API
 *    contract.
 */

function buildRootJsonMatchCondition(adapter, dbPath, match) {
  if (!match) return undefined;

  const rootApiNullMatch = getRootFieldNullMatch(match);
  const { path: jsonPath, operator, value: expectedValue, negate } = match;

  if (rootApiNullMatch === FIELD_NULL) {
    return adapter.equalsOp(dbPath, null);
  }

  if (rootApiNullMatch === FIELD_NOT_NULL) {
    return adapter.notOp(dbPath, null);
  }

  if (jsonPath.length !== 0) {
    return undefined;
  }

  if (operator === JsonMatchOperator.EQUALS) {
    return negate ? adapter.notOp(dbPath, expectedValue) : adapter.equalsOp(dbPath, expectedValue);
  }

  if (operator === JsonMatchOperator.IN) {
    return negate ? adapter.notInOp(dbPath, expectedValue) : adapter.inOp(dbPath, expectedValue);
  }

  return undefined;
}

const CommonFieldAdapterInterface = superclass =>
  class extends superclass {
    equalsOp(dbPath) {
      throw new Error(`${dbPath} is not implemented for ${this.constructor.name}`);
    }
    notOp(dbPath) {
      throw new Error(`${dbPath}_not is not implemented for ${this.constructor.name}`);
    }
    inOp(dbPath) {
      throw new Error(`${dbPath}_in is not implemented for ${this.constructor.name}`);
    }
    notInOp(dbPath) {
      throw new Error(`${dbPath}_not_in is not implemented for ${this.constructor.name}`);
    }
    matchOp(dbPath) {
      throw new Error(`${dbPath}_match is not implemented for ${this.constructor.name}`);
    }

    getQueryConditions(dbPath) {
      return {
        [this.path]: value => {
          const normalized = this.field.validateFieldFilterValue(value);
          return this.equalsOp(dbPath, normalized);
        },

        [`${this.path}_not`]: value => {
          const normalized = this.field.validateFieldFilterValue(value);
          return this.notOp(dbPath, normalized);
        },

        [`${this.path}_in`]: value => {
          const normalized = this.field.validateFieldListFilterValue(value, `${this.path}_in`);
          return this.inOp(dbPath, normalized);
        },

        [`${this.path}_not_in`]: value => {
          const normalized = this.field.validateFieldListFilterValue(value, `${this.path}_not_in`);
          return this.notInOp(dbPath, normalized);
        },

        [`${this.path}_match`]: value => {
          const normalized = this.field.validateMatchCondition(value);
          const rootMatchCondition = buildRootJsonMatchCondition(this, dbPath, normalized);
          if (rootMatchCondition !== undefined) {
            return rootMatchCondition;
          }

          return this.matchOp(dbPath, normalized);
        },
      };
    }
  };

/**
 * Mongo / Mongoose helpers
 */

function mongoRootApiNullQuery(dbPath) {
  return { [dbPath]: null };
}

function mongoRootApiNotNullQuery(dbPath) {
  return { [dbPath]: { $exists: true, $ne: null } };
}

function mongoRootApiEqualsQuery(dbPath, expectedValue) {
  return expectedValue === null
    ? mongoRootApiNullQuery(dbPath)
    : { [dbPath]: { $eq: expectedValue } };
}

function mongoRootApiNotEqualsQuery(dbPath, expectedValue) {
  return expectedValue === null
    ? mongoRootApiNotNullQuery(dbPath)
    : { $nor: [mongoRootApiEqualsQuery(dbPath, expectedValue)] };
}

function mongoRootApiInQuery(dbPath, expectedValues) {
  if (!Array.isArray(expectedValues) || expectedValues.length === 0) {
    throw new Error(`_in must be a non-empty array`);
  }

  const hasRootApiNull = expectedValues.some(item => item === null);
  const nonNullValues = expectedValues.filter(item => item !== null);

  if (!hasRootApiNull) {
    return { [dbPath]: { $in: nonNullValues } };
  }

  if (nonNullValues.length === 0) {
    return mongoRootApiNullQuery(dbPath);
  }

  return {
    $or: [mongoRootApiNullQuery(dbPath), { [dbPath]: { $in: nonNullValues } }],
  };
}

function mongoRootApiNotInQuery(dbPath, value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`_not_in must be a non-empty array`);
  }

  const hasRootApiNull = value.some(item => item === null);
  const nonNullValues = value.filter(item => item !== null);

  if (!hasRootApiNull) {
    return { $nor: [{ [dbPath]: { $in: nonNullValues } }] };
  }

  if (nonNullValues.length === 0) {
    return mongoRootApiNotNullQuery(dbPath);
  }

  return {
    $and: [mongoRootApiNotNullQuery(dbPath), { $nor: [{ [dbPath]: { $in: nonNullValues } }] }],
  };
}

function isEmptyPlainObject(value) {
  return (
    value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0
  );
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function mongoPathEqualsEmptyObject(dbPath, targetPath) {
  const targetRef = `$${targetPath}`;

  return {
    $and: [
      mongoRootApiNotNullQuery(dbPath),
      {
        $expr: {
          $eq: [
            {
              $size: {
                $objectToArray: {
                  // $objectToArray fails on non-objects. The guard turns
                  // non-objects/missing values into a one-key object, so size=0
                  // only matches a real empty object.
                  $cond: [
                    { $eq: [{ $type: targetRef }, 'object'] },
                    targetRef,
                    { __notEmptyObject: true },
                  ],
                },
              },
            },
            0,
          ],
        },
      },
    ],
  };
}

function mongoFullPath(dbPath, jsonPath) {
  if (jsonPath.length === 0) return dbPath;
  return `${dbPath}.${jsonPath.join('.')}`;
}

function mongoNumberComparisonQuery(comparisonOperator) {
  return ({ targetPath, expectedValue }) => ({
    [targetPath]: { $type: 'number', [comparisonOperator]: expectedValue },
  });
}

function mongoStringRegexQuery(buildPattern) {
  return ({ targetPath, expectedValue }) => ({
    [targetPath]: {
      $type: 'string',
      $regex: new RegExp(buildPattern(expectedValue)),
    },
  });
}

const mongoPositiveJsonQueryBuilders = {
  [JsonMatchOperator.EXISTS]: ({ dbPath, jsonPath, targetPath }) => {
    if (jsonPath.length === 0) {
      return mongoRootApiNotNullQuery(dbPath);
    }

    return {
      [dbPath]: { $exists: true, $ne: null },
      [targetPath]: { $exists: true },
    };
  },

  [JsonMatchOperator.EQUALS]: ({ dbPath, jsonPath, targetPath, expectedValue }) => {
    if (jsonPath.length > 0 && expectedValue === null) {
      return {
        [dbPath]: { $exists: true, $ne: null },
        [targetPath]: { $type: 'null' },
      };
    }

    if (jsonPath.length === 0 && expectedValue === null) {
      return mongoRootApiNullQuery(dbPath);
    }

    if (jsonPath.length > 0 && isEmptyPlainObject(expectedValue)) {
      return mongoPathEqualsEmptyObject(dbPath, targetPath);
    }

    return { [targetPath]: { $eq: expectedValue } };
  },

  [JsonMatchOperator.IN]: ({ dbPath, jsonPath, targetPath, expectedValue }) => {
    if (jsonPath.length === 0) {
      return { [dbPath]: { $in: expectedValue } };
    }

    return {
      [dbPath]: { $exists: true, $ne: null },
      [targetPath]: { $in: expectedValue },
    };
  },

  [JsonMatchOperator.NUMBER_LT]: mongoNumberComparisonQuery('$lt'),
  [JsonMatchOperator.NUMBER_LTE]: mongoNumberComparisonQuery('$lte'),
  [JsonMatchOperator.NUMBER_GT]: mongoNumberComparisonQuery('$gt'),
  [JsonMatchOperator.NUMBER_GTE]: mongoNumberComparisonQuery('$gte'),

  [JsonMatchOperator.STRING_CONTAINS]: mongoStringRegexQuery(value => escapeRegExp(value)),
  [JsonMatchOperator.STRING_STARTS_WITH]: mongoStringRegexQuery(value => `^${escapeRegExp(value)}`),
  [JsonMatchOperator.STRING_ENDS_WITH]: mongoStringRegexQuery(value => `${escapeRegExp(value)}$`),

  [JsonMatchOperator.ARRAY_CONTAINS]: ({ dbPath, targetPath, expectedValue }) =>
    mongoArrayContains(dbPath, targetPath, expectedValue),
};

function buildMongoPositiveJsonQuery(dbPath, jsonPath, operator, expectedValue) {
  const targetPath = mongoFullPath(dbPath, jsonPath);
  const buildQuery = mongoPositiveJsonQueryBuilders[operator];

  if (!buildQuery) {
    throw new Error(`Unsupported JSON match operator: ${operator}`);
  }

  return buildQuery({
    dbPath,
    jsonPath,
    targetPath,
    expectedValue,
  });
}

function assertSafeObjectPattern(value, fieldPath, depth = 0) {
  if (!isPlainObject(value)) return;

  if (depth > 8) {
    throw new Error(`JSON object pattern is too deep for ${fieldPath}`);
  }

  for (const key of Object.keys(value)) {
    if (!JSON_OBJECT_PATTERN_KEY_REGEX.test(key)) {
      throw new Error(`Invalid JSON object key "${key}" for ${fieldPath}`);
    }

    assertSafeObjectPattern(value[key], fieldPath, depth + 1);
  }
}

function mongoObjectSubsetClauses(pattern, prefix = []) {
  const entries = Object.entries(pattern);

  if (entries.length === 0) {
    if (prefix.length === 0) return [{ $type: 'object' }];
    return [{ [prefix.join('.')]: { $type: 'object' } }];
  }

  return entries.flatMap(([key, expectedValue]) => {
    const nextPath = [...prefix, key];

    if (isPlainObject(expectedValue)) {
      return mongoObjectSubsetClauses(expectedValue, nextPath);
    }

    return [
      {
        [nextPath.join('.')]: { $eq: expectedValue },
      },
    ];
  });
}

function mongoArrayContains(dbPath, targetPath, expectedValue) {
  if (isPlainObject(expectedValue)) {
    assertSafeObjectPattern(expectedValue, dbPath);

    return {
      [targetPath]: {
        $elemMatch: {
          $and: mongoObjectSubsetClauses(expectedValue),
        },
      },
    };
  }

  return {
    [targetPath]: {
      $elemMatch: { $eq: expectedValue },
    },
  };
}

export class MongoJsonInterface extends CommonFieldAdapterInterface(MongooseFieldAdapter) {
  /*
   * @param {mongoose.Schema} schema
   */
  addToMongooseSchema(schema) {
    const schemaOptions = {
      type: Object,
    };
    schema.add({ [this.path]: this.mergeSchemaOptions(schemaOptions, this.config) });

    // Mixed/Object JSON values may contain intentionally empty objects.
    // Mongoose removes empty objects by default, which breaks equals: {}.
    schema.set('minimize', false);
  }

  equalsOp(dbPath, expectedValue) {
    return mongoRootApiEqualsQuery(dbPath, expectedValue);
  }
  notOp(dbPath, expectedValue) {
    return mongoRootApiNotEqualsQuery(dbPath, expectedValue);
  }
  inOp(dbPath, expectedValues) {
    return mongoRootApiInQuery(dbPath, expectedValues);
  }
  notInOp(dbPath, expectedValues) {
    return mongoRootApiNotInQuery(dbPath, expectedValues);
  }
  matchOp(dbPath, normalized) {
    if (!normalized) return {};

    const { path: jsonPath, operator, value: expectedValue, negate } = normalized;
    const positiveQuery = buildMongoPositiveJsonQuery(dbPath, jsonPath, operator, expectedValue);

    // Negative operators are defined as the exact negation of their
    // positive pair. This makes missing paths, root null and type
    // mismatches predictable and consistent.
    return negate ? { $nor: [positiveQuery] } : positiveQuery;
  }
}

/**
 * Knex / PostgreSQL helpers
 */

function knexJsonSelector(dbPath, jsonPath) {
  if (jsonPath.length === 0) {
    return {
      jsonSql: '??',
      jsonArgs: [dbPath],
      // Root string operators must still use text extraction.
      // jsonb #>> '{}' returns the root JSON scalar as text.
      textSql: '?? #>> ?',
      textArgs: [dbPath, []],
    };
  }

  return {
    jsonSql: '?? #> ?',
    jsonArgs: [dbPath, jsonPath],
    textSql: '?? #>> ?',
    textArgs: [dbPath, jsonPath],
  };
}

function applyKnexJsonPredicate(queryBuilder, negate, sql, args) {
  // SQL boolean expressions involving NULL produce UNKNOWN.
  // `IS NOT TRUE` is intentional: it turns FALSE and UNKNOWN into TRUE.
  return queryBuilder.whereRaw(`(${sql}) IS ${negate ? 'NOT ' : ''}TRUE`, args);
}

function knexNumberComparisonPredicate(comparisonOperator) {
  return ({ selector, expectedValue }) => ({
    sql: `jsonb_typeof(${selector.jsonSql}) = 'number' AND CAST(${selector.textSql} AS FLOAT) ${comparisonOperator} ?`,
    args: [...selector.jsonArgs, ...selector.textArgs, expectedValue],
  });
}

function knexStringLikePredicate(buildLikePattern) {
  return ({ selector, expectedValue }) => ({
    sql: `jsonb_typeof(${selector.jsonSql}) = 'string' AND ${selector.textSql} LIKE ?`,
    args: [...selector.jsonArgs, ...selector.textArgs, buildLikePattern(expectedValue)],
  });
}

const knexPositiveJsonPredicateBuilders = {
  [JsonMatchOperator.EXISTS]: ({ dbPath, jsonPath, selector }) => {
    if (jsonPath.length === 0) {
      return {
        sql: '?? IS NOT NULL',
        args: [dbPath],
      };
    }

    return {
      sql: `jsonb_typeof(${selector.jsonSql}) IS NOT NULL`,
      args: selector.jsonArgs,
    };
  },

  [JsonMatchOperator.EQUALS]: ({ dbPath, jsonPath, selector, expectedValue }) => {
    if (jsonPath.length === 0 && expectedValue === null) {
      return {
        sql: '?? IS NULL',
        args: [dbPath],
      };
    }

    return {
      sql: `${selector.jsonSql} = ?::jsonb`,
      args: [...selector.jsonArgs, stringify(expectedValue)],
    };
  },

  [JsonMatchOperator.IN]: ({ selector, expectedValue }) => {
    const serializedValues = expectedValue.map(stringify);

    return {
      sql: `${selector.jsonSql} IN (${serializedValues.map(() => '?::jsonb').join(',')})`,
      args: [...selector.jsonArgs, ...serializedValues],
    };
  },

  [JsonMatchOperator.NUMBER_LT]: knexNumberComparisonPredicate('<'),
  [JsonMatchOperator.NUMBER_LTE]: knexNumberComparisonPredicate('<='),
  [JsonMatchOperator.NUMBER_GT]: knexNumberComparisonPredicate('>'),
  [JsonMatchOperator.NUMBER_GTE]: knexNumberComparisonPredicate('>='),

  [JsonMatchOperator.STRING_CONTAINS]: knexStringLikePredicate(value => `%${escapeLike(value)}%`),
  [JsonMatchOperator.STRING_STARTS_WITH]: knexStringLikePredicate(value => `${escapeLike(value)}%`),
  [JsonMatchOperator.STRING_ENDS_WITH]: knexStringLikePredicate(value => `%${escapeLike(value)}`),

  [JsonMatchOperator.ARRAY_CONTAINS]: ({ selector, expectedValue }) => ({
    sql: `jsonb_typeof(${selector.jsonSql}) = 'array' AND ${selector.jsonSql} @> ?`,
    args: [...selector.jsonArgs, ...selector.jsonArgs, stringify([expectedValue])],
  }),
};

function buildKnexPositiveJsonPredicate(dbPath, jsonPath, operator, expectedValue) {
  const selector = knexJsonSelector(dbPath, jsonPath);
  const buildPredicate = knexPositiveJsonPredicateBuilders[operator];

  if (!buildPredicate) {
    throw new Error(`Unsupported JSON match operator: ${operator}`);
  }

  return buildPredicate({
    dbPath,
    jsonPath,
    selector,
    expectedValue,
  });
}

function whereRootApiNullForJsonField(queryBuilder, dbPath) {
  return queryBuilder.where(nestedBuilder => {
    nestedBuilder.whereNull(dbPath).orWhereRaw(`?? = ?::jsonb`, [dbPath, POSTGRES_JSONB_NULL]);
  });
}

function whereSerializedJsonFieldEquals(queryBuilder, dbPath, serializedValue) {
  return queryBuilder.where(dbPath, serializedValue);
}

function whereRootApiNotNullForJsonField(queryBuilder, dbPath) {
  return queryBuilder
    .whereNotNull(dbPath)
    .whereRaw(`?? != ?::jsonb`, [dbPath, POSTGRES_JSONB_NULL]);
}

function whereSerializedJsonFieldNotEqualOrRootApiNull(queryBuilder, dbPath, serializedValue) {
  return queryBuilder.where(nestedBuilder => {
    nestedBuilder.where(dbPath, '!=', serializedValue);
    nestedBuilder.orWhereNull(dbPath).orWhereRaw(`?? = ?::jsonb`, [dbPath, POSTGRES_JSONB_NULL]);
  });
}

function whereSerializedJsonFieldInOrRootApiNull(queryBuilder, dbPath, serializedValues) {
  return queryBuilder.where(nestedBuilder => {
    if (serializedValues.length > 0) nestedBuilder.whereIn(dbPath, serializedValues);
    nestedBuilder.orWhereNull(dbPath).orWhereRaw(`?? = ?::jsonb`, [dbPath, POSTGRES_JSONB_NULL]);
  });
}

function whereSerializedJsonFieldNotInOrRootApiNull(queryBuilder, dbPath, serializedValues) {
  return queryBuilder.where(nestedBuilder => {
    if (serializedValues.length > 0) nestedBuilder.whereNotIn(dbPath, serializedValues);
    nestedBuilder.orWhereNull(dbPath).orWhereRaw(`?? = ?::jsonb`, [dbPath, POSTGRES_JSONB_NULL]);
  });
}

function whereRootApiEqualsKnexOperator(queryBuilder, dbPath, expectedValue) {
  return expectedValue === null
    ? whereRootApiNullForJsonField(queryBuilder, dbPath)
    : whereSerializedJsonFieldEquals(queryBuilder, dbPath, stringify(expectedValue));
}

function whereRootApiNotEqualsKnexOperator(queryBuilder, dbPath, expectedValue) {
  return expectedValue === null
    ? whereRootApiNotNullForJsonField(queryBuilder, dbPath)
    : whereSerializedJsonFieldNotEqualOrRootApiNull(queryBuilder, dbPath, stringify(expectedValue));
}

function whereRootApiInKnexOperator(queryBuilder, dbPath, expectedValues) {
  if (expectedValues.length === 0) {
    throw new Error(`_in must be a non-empty array`);
  }

  if (expectedValues.includes(null)) {
    return whereSerializedJsonFieldInOrRootApiNull(
      queryBuilder,
      dbPath,
      expectedValues.filter(item => item !== null).map(stringify)
    );
  }

  return queryBuilder.whereIn(dbPath, expectedValues.map(stringify));
}

function whereRootApiNotInKnexOperator(queryBuilder, dbPath, expectedValues) {
  if (expectedValues.length === 0) {
    throw new Error(`_not_in must be a non-empty array`);
  }

  if (expectedValues.includes(null)) {
    // `null` must stay in the serialized list to exclude legacy JSONB null.
    return queryBuilder.whereNotIn(dbPath, expectedValues.map(stringify)).whereNotNull(dbPath);
  }

  return whereSerializedJsonFieldNotInOrRootApiNull(
    queryBuilder,
    dbPath,
    expectedValues.map(stringify)
  );
}

export class KnexJsonInterface extends CommonFieldAdapterInterface(KnexFieldAdapter) {
  constructor() {
    super(...arguments);

    if (this.config.isUnique || this.config.isIndexed) {
      throw new Error(
        "The JSON field type doesn't support indexes on Knex. " +
          `Check the config for ${this.path} on the ${this.field.listKey} list`
      );
    }

    if (this.knexOptions && this.knexOptions.isNotNullable) {
      throw new Error(
        `JSON field "${this.field.listKey}.${this.path}" cannot be not nullable. JSON fields are always nullable.`
      );
    }
  }

  setupHooks({ addPreSaveHook }) {
    addPreSaveHook(item => {
      if (!(this.path in item)) return item;

      // API-level root null is stored as DB NULL.
      // We intentionally do not store root JSONB 'null'.
      item[this.path] = item[this.path] === null ? null : stringify(item[this.path]);

      return item;
    });
  }

  addToTableSchema(table) {
    const column = table.jsonb(this.path);

    // Do not call column.notNullable() for JSON fields.
    if (this.defaultTo) column.defaultTo(this.defaultTo);
  }

  equalsOp(dbPath, expectedValue) {
    return queryBuilder => whereRootApiEqualsKnexOperator(queryBuilder, dbPath, expectedValue);
  }
  notOp(dbPath, expectedValue) {
    return queryBuilder => whereRootApiNotEqualsKnexOperator(queryBuilder, dbPath, expectedValue);
  }
  inOp(dbPath, expectedValues) {
    return queryBuilder => whereRootApiInKnexOperator(queryBuilder, dbPath, expectedValues);
  }
  notInOp(dbPath, expectedValues) {
    return queryBuilder => whereRootApiNotInKnexOperator(queryBuilder, dbPath, expectedValues);
  }
  matchOp(dbPath, match) {
    return queryBuilder => {
      if (!match) return queryBuilder;
      const { path: jsonPath, operator, value: expectedValue, negate } = match;
      const predicate = buildKnexPositiveJsonPredicate(dbPath, jsonPath, operator, expectedValue);
      return applyKnexJsonPredicate(queryBuilder, negate, predicate.sql, predicate.args);
    };
  }
}

/**
 * Prisma helpers
 */

function getPrismaJsonNulls(adapter, fieldPath) {
  const prisma = adapter?.listAdapter?.parentAdapter?.prisma;

  if (!prisma || !prisma.DbNull || !prisma.JsonNull) {
    throw new Error(`Prisma JSON null helpers are not available for ${fieldPath}`);
  }

  return {
    dbNull: prisma.DbNull,
    jsonNull: prisma.JsonNull,
    anyNull: prisma.AnyNull,
  };
}

function prismaRootApiNullQuery(dbPath, jsonNulls) {
  // Root API null must hide Prisma's DB NULL vs JSON null distinction.
  // Prefer AnyNull when available. Fallback keeps compatibility with older Prisma shapes.
  if (typeof jsonNulls.anyNull !== 'undefined') {
    return { [dbPath]: { equals: jsonNulls.anyNull } };
  }

  return {
    OR: [{ [dbPath]: { equals: jsonNulls.dbNull } }, { [dbPath]: { equals: jsonNulls.jsonNull } }],
  };
}

function prismaRootApiNotNullQuery(dbPath, jsonNulls) {
  if (typeof jsonNulls.anyNull !== 'undefined') {
    return { NOT: { [dbPath]: { equals: jsonNulls.anyNull } } };
  }

  return {
    AND: [
      { NOT: { [dbPath]: { equals: jsonNulls.dbNull } } },
      { NOT: { [dbPath]: { equals: jsonNulls.jsonNull } } },
    ],
  };
}

function prismaJsonPathValue(expectedValue, { jsonNull }) {
  return expectedValue === null ? jsonNull : expectedValue;
}

function prismaNumberComparisonQuery(comparisonOperator) {
  return ({ dbPath, jsonPath, expectedValue }) => ({
    [dbPath]: { path: jsonPath, [comparisonOperator]: expectedValue },
  });
}

function prismaStringComparisonQuery(comparisonOperator) {
  return ({ dbPath, jsonPath, expectedValue }) => ({
    [dbPath]: { path: jsonPath, [comparisonOperator]: escapeLike(expectedValue) },
  });
}

const prismaPositiveJsonQueryBuilders = {
  [JsonMatchOperator.EXISTS]: ({ dbPath, jsonPath, jsonNulls }) => {
    if (jsonPath.length === 0) {
      return prismaRootApiNotNullQuery(dbPath, jsonNulls);
    }

    // Prisma has no first-class JSON path exists operator.
    // This shape is the closest portable representation used by Prisma JSON filters.
    return {
      AND: [
        prismaRootApiNotNullQuery(dbPath, jsonNulls),
        { NOT: { [dbPath]: { path: jsonPath, equals: jsonNulls.dbNull } } },
      ],
    };
  },

  [JsonMatchOperator.EQUALS]: ({ dbPath, jsonPath, expectedValue, jsonNulls }) => {
    if (jsonPath.length === 0 && expectedValue === null) {
      return prismaRootApiNullQuery(dbPath, jsonNulls);
    }

    if (jsonPath.length === 0) {
      return { [dbPath]: { equals: expectedValue } };
    }

    return {
      [dbPath]: {
        path: jsonPath,
        equals: prismaJsonPathValue(expectedValue, jsonNulls),
      },
    };
  },

  [JsonMatchOperator.IN]: ({ dbPath, jsonPath, expectedValue, jsonNulls }) => ({
    OR: expectedValue.map(item => {
      if (jsonPath.length === 0) {
        return { [dbPath]: { equals: item } };
      }

      return {
        [dbPath]: {
          path: jsonPath,
          equals: prismaJsonPathValue(item, jsonNulls),
        },
      };
    }),
  }),

  [JsonMatchOperator.NUMBER_LT]: prismaNumberComparisonQuery('lt'),
  [JsonMatchOperator.NUMBER_LTE]: prismaNumberComparisonQuery('lte'),
  [JsonMatchOperator.NUMBER_GT]: prismaNumberComparisonQuery('gt'),
  [JsonMatchOperator.NUMBER_GTE]: prismaNumberComparisonQuery('gte'),

  [JsonMatchOperator.STRING_CONTAINS]: prismaStringComparisonQuery('string_contains'),
  [JsonMatchOperator.STRING_STARTS_WITH]: prismaStringComparisonQuery('string_starts_with'),
  [JsonMatchOperator.STRING_ENDS_WITH]: prismaStringComparisonQuery('string_ends_with'),

  [JsonMatchOperator.ARRAY_CONTAINS]: ({ dbPath, jsonPath, expectedValue }) => ({
    [dbPath]: { path: jsonPath, array_contains: [expectedValue] },
  }),
};

function buildPrismaPositiveJsonQuery(dbPath, jsonPath, operator, expectedValue, jsonNulls) {
  const buildQuery = prismaPositiveJsonQueryBuilders[operator];

  if (!buildQuery) {
    throw new Error(`Unsupported JSON match operator: ${operator}`);
  }

  return buildQuery({
    dbPath,
    jsonPath,
    expectedValue,
    jsonNulls,
  });
}

function buildPrismaNegatedJsonQuery(dbPath, jsonPath, positiveQuery, jsonNulls) {
  if (jsonPath.length === 0) {
    return { NOT: positiveQuery };
  }

  const existsQuery = buildPrismaPositiveJsonQuery(
    dbPath,
    jsonPath,
    JsonMatchOperator.EXISTS,
    true,
    jsonNulls
  );

  return {
    OR: [
      { NOT: positiveQuery },

      // Prisma's JSON path NOT does not reliably include missing paths/root null.
      // We add NOT(exists:true) explicitly to preserve the contract:
      // negative operators match missing paths and root API null.
      { NOT: existsQuery },
    ],
  };
}

export class PrismaJsonInterface extends CommonFieldAdapterInterface(PrismaFieldAdapter) {
  getPrismaSchema() {
    return [this._schemaField({ type: 'Json' })];
  }

  equalsOp(dbPath, expectedValue) {
    const jsonNulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);
    return expectedValue === null
      ? prismaRootApiNullQuery(dbPath, jsonNulls)
      : { [dbPath]: { equals: expectedValue } };
  }
  notOp(dbPath, expectedValue) {
    const jsonNulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);

    return expectedValue === null
      ? prismaRootApiNotNullQuery(dbPath, jsonNulls)
      : {
          OR: [
            { NOT: { [dbPath]: { equals: expectedValue } } },
            prismaRootApiNullQuery(dbPath, jsonNulls),
          ],
        };
  }
  inOp(dbPath, expectedValues) {
    if (expectedValues.length === 0) {
      throw new Error(`${this.path}_in must be a non-empty array`);
    }

    const jsonNulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);

    if (expectedValues.includes(null)) {
      const nonNullQuery = expectedValues
        .filter(item => item !== null)
        .map(item => ({
          [dbPath]: { equals: item },
        }));

      if (nonNullQuery.length > 0) {
        return {
          OR: [...nonNullQuery, prismaRootApiNullQuery(dbPath, jsonNulls)],
        };
      }

      return prismaRootApiNullQuery(dbPath, jsonNulls);
    }

    return {
      AND: [
        prismaRootApiNotNullQuery(dbPath, jsonNulls),
        {
          OR: expectedValues.map(item => ({
            [dbPath]: { equals: item },
          })),
        },
      ],
    };
  }
  notInOp(dbPath, expectedValues) {
    if (expectedValues.length === 0) {
      throw new Error(`${this.path}_not_in must be a non-empty array`);
    }

    const jsonNulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);

    if (expectedValues.includes(null)) {
      const nonNullQuery = expectedValues
        .filter(item => item !== null)
        .map(item => ({
          NOT: { [dbPath]: { equals: item } },
        }));

      if (nonNullQuery.length > 0) {
        return {
          AND: [...nonNullQuery, prismaRootApiNotNullQuery(dbPath, jsonNulls)],
        };
      }

      return prismaRootApiNotNullQuery(dbPath, jsonNulls);
    }

    return {
      OR: [
        {
          NOT: {
            OR: expectedValues.map(item => ({ [dbPath]: { equals: item } })),
          },
        },
        prismaRootApiNullQuery(dbPath, jsonNulls),
      ],
    };
  }
  matchOp(dbPath, match) {
    if (!match) return {};

    const { path: jsonPath, operator, value: expectedValue, negate } = match;
    const jsonNulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);
    const positiveQuery = buildPrismaPositiveJsonQuery(
      dbPath,
      jsonPath,
      operator,
      expectedValue,
      jsonNulls
    );

    return negate
      ? buildPrismaNegatedJsonQuery(dbPath, jsonPath, positiveQuery, jsonNulls)
      : positiveQuery;
  }
}
