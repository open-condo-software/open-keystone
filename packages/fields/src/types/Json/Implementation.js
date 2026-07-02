import { KnexFieldAdapter } from '@open-keystone/adapter-knex';
import { MongooseFieldAdapter } from '@open-keystone/adapter-mongoose';
import { PrismaFieldAdapter } from '@open-keystone/adapter-prisma';
import { Implementation } from '../../Implementation';
import isFunction from 'lodash.isfunction';
import { escapeRegExp, identity } from '@open-keystone/utils';

const stringify = JSON.stringify;

const FIELD_NULL = 'FIELD_NULL';
const FIELD_NOT_NULL = 'FIELD_NOT_NULL';
const JSON_NULL = stringify(null);

const NEGATED_OPERATOR = {
  not: 'equals',
  not_in: 'in',

  string_not_contains: 'string_contains',
  string_not_starts_with: 'string_starts_with',
  string_not_ends_with: 'string_ends_with',

  array_not_contains: 'array_contains',
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function normalizeJsonMatchInput(value) {
  const { path = [], ...conditions } = value;
  const operator = Object.keys(conditions).find(key => conditions[key] !== undefined);
  const expected = conditions[operator];

  if (operator === 'exists') {
    return {
      path,
      operator: 'exists',
      value: true,
      negate: expected === false,
    };
  }

  if (hasOwn(NEGATED_OPERATOR, operator)) {
    return {
      path,
      operator: NEGATED_OPERATOR[operator],
      value: expected,
      negate: true,
    };
  }

  return {
    path,
    operator,
    value: expected,
    negate: false,
  };
}

function getRootFieldNullMatch(path, conditions) {
  if (path.length > 0) return null;

  if (hasOwn(conditions, 'equals') && conditions.equals === null) return FIELD_NULL;
  if (hasOwn(conditions, 'not') && conditions.not === null) return FIELD_NOT_NULL;

  if (hasOwn(conditions, 'exists')) {
    return conditions.exists ? FIELD_NOT_NULL : FIELD_NULL;
  }

  return null;
}

function assertJsonFieldIsNullable(field) {
  if (field.config.knexOptions && field.config.knexOptions.isNotNullable) {
    throw new Error(
      `JSON field "${field.listKey}.${field.path}" cannot be not nullable. JSON fields are always nullable.`
    );
  }
}

const JSON_PATH_SEGMENT_REGEX =
  /^(?!(?:__proto__|prototype|constructor|__typename)$)(?:[_A-Za-z][_A-Za-z0-9]*|0|[1-9][0-9]{0,3})$/;
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
      ...this.equalityInputFields(this.graphQLInputType),
      ...this.inInputFields(this.graphQLInputType),
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
    const { path, ...conditions } = value;

    if (path !== undefined) {
      if (!Array.isArray(path)) {
        throw new Error(`JSON path must be an array of strings for ${this.listKey}.${this.path}`);
      }
      if (path.length === 0) {
        throw new Error(`JSON path cannot be empty for ${this.listKey}.${this.path}`);
      }
      for (const segment of path) {
        if (typeof segment !== 'string') {
          throw new Error(
            `Invalid JSON path segment "${segment}" for ${this.listKey}.${this.path}. Segment must be a string.`
          );
        }
        if (!JSON_PATH_SEGMENT_REGEX.test(segment)) {
          throw new Error(
            `Invalid JSON path segment "${segment}" for ${this.listKey}.${this.path}`
          );
        }
      }

      if (this.config.allowedPaths) {
        const isAllowed = this.config.allowedPaths.some(allowedPath => {
          if (allowedPath.length !== path.length) return false;
          return allowedPath.every((segment, i) => segment === path[i]);
        });
        if (!isAllowed) {
          throw new Error(
            `JSON path ${JSON.stringify(path)} is not allowed for ${this.listKey}.${this.path}`
          );
        }
      }
    }

    const conditionKeys = Object.keys(conditions).filter(k => conditions[k] !== undefined);
    if (conditionKeys.length > 1) {
      throw new Error(
        `Only one condition can be used in JsonMatchInput for ${this.listKey}.${this.path}. Use OR / AND to combine conditions.`
      );
    }
    if (conditionKeys.length === 0) {
      throw new Error(
        `One condition is required in JsonMatchInput for ${this.listKey}.${this.path}`
      );
    }

    const [operator] = conditionKeys;
    const conditionValue = conditions[operator];

    if (operator === 'in' || operator === 'not_in') {
      if (!Array.isArray(conditionValue)) {
        throw new Error(`${operator} must be an array for ${this.listKey}.${this.path}`);
      }
      if (conditionValue.length === 0) {
        throw new Error(`${operator} must be a non-empty array for ${this.listKey}.${this.path}`);
      }
    }
    if (operator.startsWith('string_') && typeof conditionValue !== 'string') {
      throw new Error(`${operator} must be a string for ${this.listKey}.${this.path}`);
    }
    if (operator.startsWith('number_') && typeof conditionValue !== 'number') {
      throw new Error(`${operator} must be a number for ${this.listKey}.${this.path}`);
    }
    if (operator === 'exists' && typeof conditionValue !== 'boolean') {
      throw new Error(`exists must be a boolean for ${this.listKey}.${this.path}`);
    }
  }
}

const CommonFieldAdapterInterface = superclass =>
  class extends superclass {
    getQueryConditions(dbPath) {
      return {
        ...this.equalityConditions(dbPath),
        ...this.inConditions(dbPath),
        ...this.matchConditions(dbPath),
      };
    }

    matchConditions() {
      return {
        [`${this.path}_match`]: () => {
          throw new Error(
            `Filter ${this.path}_match is not supported by the ${this.listAdapter.parentAdapter.name} adapter`
          );
        },
      };
    }
  };

/**
 * Mongo / Mongoose helpers
 */

function mongoFieldNull(dbPath) {
  return { [dbPath]: null };
}

function mongoFieldNotNull(dbPath) {
  return { [dbPath]: { $exists: true, $ne: null } };
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
  const ref = `$${targetPath}`;

  return {
    $and: [
      mongoFieldNotNull(dbPath),
      {
        $expr: {
          $eq: [
            {
              $size: {
                $objectToArray: {
                  // $objectToArray fails on non-objects. The guard turns
                  // non-objects/missing values into a one-key object, so size=0
                  // only matches a real empty object.
                  $cond: [{ $eq: [{ $type: ref }, 'object'] }, ref, { __notEmptyObject: true }],
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

function fullPath(dbPath, path) {
  if (path.length === 0) return dbPath;
  return `${dbPath}.${path.join('.')}`;
}

function buildMongoPositiveJsonQuery(dbPath, path, operator, value) {
  const targetPath = fullPath(dbPath, path);

  if (operator === 'exists') {
    if (path.length === 0) {
      return mongoFieldNotNull(dbPath);
    }

    return {
      [dbPath]: { $exists: true, $ne: null },
      [targetPath]: { $exists: true },
    };
  }

  if (operator === 'equals') {
    if (path.length > 0 && value === null) {
      return {
        [dbPath]: { $exists: true, $ne: null },
        [targetPath]: { $type: 'null' },
      };
    }

    if (path.length === 0 && value === null) {
      return mongoFieldNull(dbPath);
    }

    if (path.length > 0 && isEmptyPlainObject(value)) {
      return mongoPathEqualsEmptyObject(dbPath, targetPath);
    }

    return { [targetPath]: { $eq: value } };
  }

  if (operator === 'in') {
    if (path.length === 0) {
      return { [dbPath]: { $in: value } };
    }

    return {
      [dbPath]: { $exists: true, $ne: null },
      [targetPath]: { $in: value },
    };
  }

  if (operator === 'number_lt') {
    return { [targetPath]: { $type: 'number', $lt: value } };
  }

  if (operator === 'number_lte') {
    return { [targetPath]: { $type: 'number', $lte: value } };
  }

  if (operator === 'number_gt') {
    return { [targetPath]: { $type: 'number', $gt: value } };
  }

  if (operator === 'number_gte') {
    return { [targetPath]: { $type: 'number', $gte: value } };
  }

  if (operator === 'string_contains') {
    return {
      [targetPath]: {
        $type: 'string',
        $regex: new RegExp(escapeRegExp(value)),
      },
    };
  }

  if (operator === 'string_starts_with') {
    return {
      [targetPath]: {
        $type: 'string',
        $regex: new RegExp(`^${escapeRegExp(value)}`),
      },
    };
  }

  if (operator === 'string_ends_with') {
    return {
      [targetPath]: {
        $type: 'string',
        $regex: new RegExp(`${escapeRegExp(value)}$`),
      },
    };
  }

  if (operator === 'array_contains') {
    return mongoArrayContains(dbPath, targetPath, value);
  }

  throw new Error(`Unsupported JSON match operator: ${operator}`);
}

function assertSafeObjectPattern(value, fieldPath, depth = 0) {
  if (!isPlainObject(value)) return;

  if (depth > 8) {
    throw new Error(`JSON object pattern is too deep for ${fieldPath}`);
  }

  for (const key of Object.keys(value)) {
    if (!JSON_OBJECT_PATTERN_KEY_REGEX.test(key)) {
      throw new Error(`Invalid JSON object pattern key "${key}" for ${fieldPath}`);
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

  return entries.flatMap(([key, expected]) => {
    const nextPath = [...prefix, key];

    if (isPlainObject(expected)) {
      return mongoObjectSubsetClauses(expected, nextPath);
    }

    return [
      {
        [nextPath.join('.')]: { $eq: expected },
      },
    ];
  });
}

function mongoArrayContains(dbPath, targetPath, value) {
  if (isPlainObject(value)) {
    assertSafeObjectPattern(value, dbPath);

    return {
      [targetPath]: {
        $elemMatch: {
          $and: mongoObjectSubsetClauses(value),
        },
      },
    };
  }

  return {
    [targetPath]: {
      $elemMatch: { $eq: value },
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

    schema.set('strict', false);
  }

  equalityConditions(dbPath) {
    const equals = value =>
      value === null ? mongoFieldNull(dbPath) : { [dbPath]: { $eq: value } };

    return {
      [this.path]: value => equals(value),

      [`${this.path}_not`]: value =>
        value === null ? mongoFieldNotNull(dbPath) : { $nor: [equals(value)] },
    };
  }

  inConditions(dbPath) {
    return {
      [`${this.path}_in`]: value => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error(`${this.path}_in must be a non-empty array`);
        }

        const hasNull = value.some(item => item === null);
        const values = value.filter(item => item !== null);

        if (!hasNull) {
          return { [dbPath]: { $in: values } };
        }

        if (values.length === 0) {
          return { [dbPath]: null };
        }

        return {
          $or: [
            { [dbPath]: null },
            { [dbPath]: { $in: values } },
          ],
        };
      },

      [`${this.path}_not_in`]: value => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error(`${this.path}_not_in must be a non-empty array`);
        }

        const hasNull = value.some(item => item === null);
        const values = value.filter(item => item !== null);

        if (!hasNull) {
          return { $nor: [{ [dbPath]: { $in: values } }] };
        }

        if (values.length === 0) {
          return { [dbPath]: { $exists: true, $ne: null } };
        }

        return {
          $and: [
            { [dbPath]: { $exists: true, $ne: null } },
            { $nor: [{ [dbPath]: { $in: values } }] },
          ],
        };
      },
    };
  }

  matchConditions(dbPath) {
    return {
      [`${this.path}_match`]: value => {
        if (value === null || value === undefined) {
          return {};
        }
        this.field.validateMatchCondition(value);

        const { path, operator, value: expected, negate } = normalizeJsonMatchInput(value);

        const rootFieldNullMatch = getRootFieldNullMatch(path, value); // use raw value here to find operator

        if (rootFieldNullMatch === FIELD_NULL) {
          return mongoFieldNull(dbPath);
        }

        if (rootFieldNullMatch === FIELD_NOT_NULL) {
          return mongoFieldNotNull(dbPath);
        }

        const positiveQuery = buildMongoPositiveJsonQuery(dbPath, path, operator, expected);

        // Negative operators are defined as the exact negation of their
        // positive pair. This makes missing paths, root null and type
        // mismatches predictable and consistent.
        return negate ? { $nor: [positiveQuery] } : positiveQuery;
      },
    };
  }
}

/**
 * Knex / PostgreSQL helpers
 */

function knexJsonSelector(dbPath, path) {
  if (path.length === 0) {
    return {
      json: '??',
      jsonArgs: [dbPath],
      // Root string operators must still use text extraction.
      // jsonb #>> '{}' returns the root JSON scalar as text.
      text: '?? #>> ?',
      textArgs: [dbPath, []],
    };
  }

  return {
    json: '?? #> ?',
    jsonArgs: [dbPath, path],
    text: '?? #>> ?',
    textArgs: [dbPath, path],
  };
}

function applyKnexJsonPredicate(b, negate, sql, args) {
  // SQL boolean expressions involving NULL produce UNKNOWN.
  // `IS NOT TRUE` is intentional: it turns FALSE and UNKNOWN into TRUE.
  return b.whereRaw(`(${sql}) IS ${negate ? 'NOT ' : ''}TRUE`, args);
}

function buildKnexPositiveJsonPredicate(dbPath, path, operator, value) {
  const s = knexJsonSelector(dbPath, path);

  if (operator === 'exists') {
    if (path.length === 0) {
      return {
        sql: '?? IS NOT NULL',
        args: [dbPath],
      };
    }

    return {
      sql: `jsonb_typeof(${s.json}) IS NOT NULL`,
      args: s.jsonArgs,
    };
  }

  if (operator === 'equals') {
    if (path.length === 0 && value === null) {
      return {
        sql: '?? IS NULL',
        args: [dbPath],
      };
    }

    return {
      sql: `${s.json} = ?::jsonb`,
      args: [...s.jsonArgs, stringify(value)],
    };
  }

  if (operator === 'in') {
    const values = value.map(stringify);

    return {
      sql: `${s.json} IN (${values.map(() => '?::jsonb').join(',')})`,
      args: [...s.jsonArgs, ...values],
    };
  }

  if (operator === 'number_lt') {
    return {
      sql: `jsonb_typeof(${s.json}) = 'number' AND CAST(${s.text} AS FLOAT) < ?`,
      args: [...s.jsonArgs, ...s.textArgs, value],
    };
  }

  if (operator === 'number_lte') {
    return {
      sql: `jsonb_typeof(${s.json}) = 'number' AND CAST(${s.text} AS FLOAT) <= ?`,
      args: [...s.jsonArgs, ...s.textArgs, value],
    };
  }

  if (operator === 'number_gt') {
    return {
      sql: `jsonb_typeof(${s.json}) = 'number' AND CAST(${s.text} AS FLOAT) > ?`,
      args: [...s.jsonArgs, ...s.textArgs, value],
    };
  }

  if (operator === 'number_gte') {
    return {
      sql: `jsonb_typeof(${s.json}) = 'number' AND CAST(${s.text} AS FLOAT) >= ?`,
      args: [...s.jsonArgs, ...s.textArgs, value],
    };
  }

  if (operator === 'string_contains') {
    return {
      sql: `jsonb_typeof(${s.json}) = 'string' AND ${s.text} LIKE ?`,
      args: [...s.jsonArgs, ...s.textArgs, `%${value}%`],
    };
  }

  if (operator === 'string_starts_with') {
    return {
      sql: `jsonb_typeof(${s.json}) = 'string' AND ${s.text} LIKE ?`,
      args: [...s.jsonArgs, ...s.textArgs, `${value}%`],
    };
  }

  if (operator === 'string_ends_with') {
    return {
      sql: `jsonb_typeof(${s.json}) = 'string' AND ${s.text} LIKE ?`,
      args: [...s.jsonArgs, ...s.textArgs, `%${value}`],
    };
  }

  if (operator === 'array_contains') {
    return {
      sql: `jsonb_typeof(${s.json}) = 'array' AND ${s.json} @> ?`,
      args: [...s.jsonArgs, ...s.jsonArgs, stringify([value])],
    };
  }

  throw new Error(`Unsupported JSON match operator: ${operator}`);
}

function whereJsonFieldNull(b, dbPath) {
  return b.where(q => {
    q.whereNull(dbPath).orWhereRaw(`?? = ?::jsonb`, [dbPath, JSON_NULL]);
  });
}

function whereJsonFieldEqual(b, dbPath, value) {
  return b.where(dbPath, value);
}

function whereJsonFieldNotNull(b, dbPath) {
  return b.whereNotNull(dbPath).whereRaw(`?? != ?::jsonb`, [dbPath, JSON_NULL]);
}

function whereJsonFieldNotEqualOrNull(b, dbPath, value) {
  return b.where(q => {
    q.where(dbPath, '!=', value);
    q.orWhereNull(dbPath).orWhereRaw(`?? = ?::jsonb`, [dbPath, JSON_NULL]);
  });
}

function whereJsonFieldInOrNull(b, dbPath, values) {
  return b.where(q => {
    if (values.length > 0) q.whereIn(dbPath, values);
    q.orWhereNull(dbPath).orWhereRaw(`?? = ?::jsonb`, [dbPath, JSON_NULL]);
  });
}

function whereJsonFieldNotInOrNull(b, dbPath, values) {
  return b.where(q => {
    if (values.length > 0) q.whereNotIn(dbPath, values);
    q.orWhereNull(dbPath).orWhereRaw(`?? = ?::jsonb`, [dbPath, JSON_NULL]);
  });
}

function whereJsonFieldEqualKnexOperator(b, dbPath, value, f = stringify) {
  return value === null
    ? whereJsonFieldNull(b, dbPath)
    : whereJsonFieldEqual(b, dbPath, f(value))
}

function whereJsonFieldNotEqualKnexOperator(b, dbPath, value, f = stringify) {
  return value === null
    ? whereJsonFieldNotNull(b, dbPath)
    : whereJsonFieldNotEqualOrNull(b, dbPath, f(value));
}

function whereJsonFieldInKnexOperator(b, dbPath, value, f = stringify) {
  if (value.length === 0) {
    throw new Error(`_in must be a non-empty array`);
  }

  if (value.includes(null)) {
    return whereJsonFieldInOrNull(b, dbPath, value.filter(x => x !== null).map(f));
  }

  return b.whereIn(dbPath, value.map(f));
}

function whereJsonFieldNotInKnexOperator(b, dbPath, value, f = stringify) {
  if (value.length === 0) {
    throw new Error(`_not_in must be a non-empty array`);
  }

  if (value.includes(null)) {
    // NOTE: `null` should be included in `value` array!
    return b.whereNotIn(dbPath, value.map(f)).whereNotNull(dbPath);
  }

  return whereJsonFieldNotInOrNull(b, dbPath, value.map(f));
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

  equalityConditions(dbPath, f = stringify) {
    return {
      [this.path]: value => b => whereJsonFieldEqualKnexOperator(b, dbPath, value, f),
      [`${this.path}_not`]: value => b => whereJsonFieldNotEqualKnexOperator(b, dbPath, value, f),
    };
  }

  inConditions(dbPath, f = stringify) {
    return {
      [`${this.path}_in`]: value => b => whereJsonFieldInKnexOperator(b, dbPath, value, f),
      [`${this.path}_not_in`]: value => b => whereJsonFieldNotInKnexOperator(b, dbPath, value, f),
    };
  }

  matchConditions(dbPath, f = stringify) {
    return {
      [`${this.path}_match`]: value => b => {
        if (value === null || value === undefined) return b;

        this.field.validateMatchCondition(value);

        const { path, operator, value: expected, negate } = normalizeJsonMatchInput(value);

        const rootFieldNullMatch = getRootFieldNullMatch(path, value);

        // NOTE: common {field}_in, {field}_not_in, {field}_not, {filed} and NULL cases
        if (rootFieldNullMatch === FIELD_NULL) {
          return whereJsonFieldNull(b, dbPath);
        } else if (rootFieldNullMatch === FIELD_NOT_NULL) {
          return whereJsonFieldNotNull(b, dbPath);
        } else if (path.length === 0 && operator === 'equals') {
          return whereJsonFieldEqualKnexOperator(b, dbPath, expected, f);
        } else if (path.length === 0 && operator === 'not') {
          return whereJsonFieldNotEqualKnexOperator(b, dbPath, expected, f);
        } else if (path.length === 0 && operator === 'in') {
          return whereJsonFieldInKnexOperator(b, dbPath, expected, f);
        } else if (path.length === 0 && operator === 'not_in') {
          return whereJsonFieldNotInKnexOperator(b, dbPath, expected, f);
        }

        const predicate = buildKnexPositiveJsonPredicate(dbPath, path, operator, expected);

        return applyKnexJsonPredicate(b, negate, predicate.sql, predicate.args);
      },
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
  };
}

function prismaFieldNull(dbPath, nulls) {
  // Root API null must hide Prisma's DB NULL vs JSON null distinction.
  // Prefer AnyNull when available. Fallback keeps compatibility with older Prisma shapes.
  if (typeof nulls.anyNull !== 'undefined') {
    return { [dbPath]: { equals: nulls.anyNull } };
  }

  return {
    OR: [{ [dbPath]: { equals: nulls.dbNull } }, { [dbPath]: { equals: nulls.jsonNull } }],
  };
}

function prismaFieldNotNull(dbPath, nulls) {
  if (typeof nulls.anyNull !== 'undefined') {
    return { NOT: { [dbPath]: { equals: nulls.anyNull } } };
  }

  return {
    AND: [
      { NOT: { [dbPath]: { equals: nulls.dbNull } } },
      { NOT: { [dbPath]: { equals: nulls.jsonNull } } },
    ],
  };
}

function prismaJsonValue(value, { jsonNull }) {
  return value === null ? jsonNull : value;
}

function buildPrismaPositiveJsonQuery(dbPath, path, operator, value, nulls) {
  if (operator === 'exists') {
    if (path.length === 0) {
      return prismaFieldNotNull(dbPath, nulls);
    }

    // Prisma has no first-class JSON path exists operator.
    // This shape is the closest portable representation used by Prisma JSON filters.
    return {
      AND: [
        prismaFieldNotNull(dbPath, nulls),
        { NOT: { [dbPath]: { path, equals: nulls.dbNull } } },
      ],
    };
  }

  if (operator === 'equals') {
    if (path.length === 0 && value === null) {
      return prismaFieldNull(dbPath, nulls);
    }

    if (path.length === 0) {
      return { [dbPath]: { equals: value } };
    }

    return {
      [dbPath]: {
        path,
        equals: value === null ? nulls.jsonNull : value,
      },
    };
  }

  if (operator === 'in') {
    return {
      OR: value.map(item => {
        if (path.length === 0) {
          return { [dbPath]: { equals: item } };
        }

        return {
          [dbPath]: {
            path,
            equals: prismaJsonValue(item, nulls),
          },
        };
      }),
    };
  }

  if (operator === 'number_lt') return { [dbPath]: { path, lt: value } };
  if (operator === 'number_lte') return { [dbPath]: { path, lte: value } };
  if (operator === 'number_gt') return { [dbPath]: { path, gt: value } };
  if (operator === 'number_gte') return { [dbPath]: { path, gte: value } };

  if (operator === 'string_contains') {
    return { [dbPath]: { path, string_contains: value } };
  }

  if (operator === 'string_starts_with') {
    return { [dbPath]: { path, string_starts_with: value } };
  }

  if (operator === 'string_ends_with') {
    return { [dbPath]: { path, string_ends_with: value } };
  }

  if (operator === 'array_contains') {
    return { [dbPath]: { path, array_contains: [value] } };
  }

  throw new Error(`Unsupported JSON match operator: ${operator}`);
}

function buildPrismaNegatedJsonQuery(dbPath, path, positiveQuery, nulls) {
  if (path.length === 0) {
    return { NOT: positiveQuery };
  }

  const existsQuery = buildPrismaPositiveJsonQuery(dbPath, path, 'exists', true, nulls);

  return {
    OR: [
      { NOT: positiveQuery },

      // Prisma's JSON path NOT does not reliably include missing paths/root null.
      // We add NOT(exists:true) explicitly to preserve the contract:
      // negative operators match missing paths and root field null.
      { NOT: existsQuery },
    ],
  };
}

export class PrismaJsonInterface extends CommonFieldAdapterInterface(PrismaFieldAdapter) {
  getPrismaSchema() {
    return [this._schemaField({ type: 'Json' })];
  }

  equalityConditions(dbPath) {
    return {
      [this.path]: value => {
        const nulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);

        return value === null ? prismaFieldNull(dbPath, nulls) : { [dbPath]: { equals: value } };
      },

      [`${this.path}_not`]: value => {
        const nulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);

        return value === null
          ? prismaFieldNotNull(dbPath, nulls)
          : {
              OR: [{ NOT: { [dbPath]: { equals: value } } }, prismaFieldNull(dbPath, nulls)],
            };
      },
    };
  }

  inConditions(dbPath, f = identity) {
    return {
      [`${this.path}_in`]: value => {
        if (value.length === 0) {
          throw new Error(`${this.path}_in must be a non-empty array`);
        }

        const nulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);

        if (value.includes(null)) {
          const nonNullQuery = value
            .filter(x => x !== null)
            .map(x => ({
              [dbPath]: { equals: x },
            }))
          if (nonNullQuery.length > 0) {
            return {
              OR: [...nonNullQuery, prismaFieldNull(dbPath, nulls)],
            };
          } else {
            return prismaFieldNull(dbPath, nulls);
          }
        }

        return {
          AND: [
            prismaFieldNotNull(dbPath, nulls),
            {
              OR: value.map(x => ({
                [dbPath]: { equals: x },
              })),
            },
          ],
        };
      },

      [`${this.path}_not_in`]: value => {
        if (value.length === 0) {
          throw new Error(`${this.path}_not_in must be a non-empty array`);
        }

        const nulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);

        if (value.includes(null)) {
          const nonNullQuery = value
            .filter(x => x !== null)
            .map(x => ({
              NOT: { [dbPath]: { equals: x } },
            }));

          if (nonNullQuery.length > 0) {
            return {
              AND: [...nonNullQuery, prismaFieldNotNull(dbPath, nulls)],
            };
          } else {
            return prismaFieldNotNull(dbPath, nulls);
          }
        }

        return {
          OR: [
            {
              NOT: {
                OR: value.map(item => ({ [dbPath]: { equals: item } })),
              },
            },
            prismaFieldNull(dbPath, nulls),
          ],
        };
      },
    };
  }

  matchConditions(dbPath) {
    return {
      [`${this.path}_match`]: value => {
        if (value === null || value === undefined) {
          return {};
        }
        this.field.validateMatchCondition(value);

        const nulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);
        const { path, operator, value: expected, negate } = normalizeJsonMatchInput(value);

        // Handle root null directly. This avoids relying on nested NOT shapes
        // and keeps equals:null / exists:false / not:null equivalent to field filters.
        if (path.length === 0 && operator === 'equals' && expected === null) {
          return negate ? prismaFieldNotNull(dbPath, nulls) : prismaFieldNull(dbPath, nulls);
        }

        if (path.length === 0 && operator === 'exists') {
          return negate ? prismaFieldNull(dbPath, nulls) : prismaFieldNotNull(dbPath, nulls);
        }

        // if (operator === 'array_contains' && negate) {
        //   // Prisma JSON filters cannot express:
        //   //   path is missing OR path is not an array OR array does not contain item
        //   // through normal `where`.
        //   //
        //   // In PostgreSQL this is easy with raw SQL:
        //   //   jsonb_typeof(path) IS DISTINCT FROM 'array' OR NOT (path @> ...)
        //   //
        //   // But Prisma keeps the JSON array type guard inside its generated filter
        //   // in a way that does not make scalar JSON values match under NOT.
        //   // Returning wrong data is worse than failing explicitly.
        //   throw new Error(
        //     `Filter ${this.path}_match.array_not_contains is not supported by the Prisma adapter`
        //   );
        // }

        const positiveQuery = buildPrismaPositiveJsonQuery(dbPath, path, operator, expected, nulls);

        return negate
          ? buildPrismaNegatedJsonQuery(dbPath, path, positiveQuery, nulls)
          : positiveQuery;
      },
    };
  }
}
