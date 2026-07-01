import { KnexFieldAdapter } from '@open-keystone/adapter-knex';
import { MongooseFieldAdapter } from '@open-keystone/adapter-mongoose';
import { PrismaFieldAdapter } from '@open-keystone/adapter-prisma';
import { Implementation } from '../../Implementation';
import isFunction from 'lodash.isfunction';
import { escapeRegExp } from '@open-keystone/utils';

function fullPath(dbPath, path) {
  if (path.length === 0) return dbPath;
  return `${dbPath}.${path.join('.')}`;
}

const stringify = JSON.stringify;

const FIELD_NULL = 'FIELD_NULL';
const FIELD_NOT_NULL = 'FIELD_NOT_NULL';

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

  const conditionKey = Object.keys(conditions).find(key => conditions[key] !== undefined);
  const rawValue = conditions[conditionKey];

  if (conditionKey === 'exists') {
    return {
      path,
      operator: 'exists',
      value: true,
      negate: rawValue === false,
    };
  }

  if (hasOwn(NEGATED_OPERATOR, conditionKey)) {
    return {
      path,
      operator: NEGATED_OPERATOR[conditionKey],
      value: rawValue,
      negate: true,
    };
  }

  return {
    path,
    operator: conditionKey,
    value: rawValue,
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
  if (field.isRequired || field.config.isRequired || field.config.required) {
    throw new Error(
      `JSON field "${field.listKey}.${field.path}" cannot be required. JSON fields are always nullable.`
    );
  }

  if (field.config.knexOptions && field.config.knexOptions.isNotNullable) {
    throw new Error(
      `JSON field "${field.listKey}.${field.path}" cannot be not nullable. JSON fields are always nullable.`
    );
  }
}

const JSON_PATH_SEGMENT_REGEX =
  /^(?!(?:__proto__|prototype|constructor|__typename)$)(?:[_A-Za-z][_A-Za-z0-9]*|0|[1-9][0-9]{0,3})$/;

export class Json extends Implementation {
  // NOTE: argument names are based no Virtual field
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
      `${this.path}_in: [${this.graphQLInputType}!]`,
      `${this.path}_not_in: [${this.graphQLInputType}!]`,
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

    if (path !== undefined && path !== null) {
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

function mongoFieldNull(dbPath) {
  return { [dbPath]: null };
}

function mongoFieldNotNull(dbPath) {
  return { [dbPath]: { $exists: true, $ne: null } };
}

function mongoPathEqualsNull(dbPath, targetPath) {
  return {
    $and: [mongoFieldNotNull(dbPath), { [targetPath]: null }, { [targetPath]: { $exists: true } }],
  };
}

function isEmptyPlainObject(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

function mongoPathEqualsEmptyObject(targetPath) {
  const ref = `$${targetPath}`;

  return {
    $expr: {
      $eq: [
        {
          $size: {
            $objectToArray: {
              $cond: [{ $eq: [{ $type: ref }, 'object'] }, ref, { __notEmptyObject: true }],
            },
          },
        },
        0,
      ],
    },
  };
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
    if (path.length > 0) {
      if (value === null) {
        return {
          [dbPath]: { $exists: true, $ne: null },
          [targetPath]: { $type: 'null' },
        };
      }

      if (isEmptyPlainObject(value)) {
        // NOTE(pahaz): this hack really don't work
        return {
          $and: [mongoFieldNotNull(dbPath), mongoPathEqualsEmptyObject(targetPath)],
        };
      }
      return { [targetPath]: { $eq: value } };
    }

    return { [targetPath]: { $eq: value } };
  }

  if (operator === 'in') {
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
    return {
      [targetPath]: {
        $elemMatch: { $eq: value },
      },
    };
  }

  throw new Error(`Unsupported JSON match operator: ${operator}`);
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
    schema.set('strict', false);
  }

  equalityConditions(dbPath) {
    return {
      [this.path]: value => (value === null ? mongoFieldNull(dbPath) : { [dbPath]: { $eq: value } }),

      [`${this.path}_not`]: value =>
        value === null ? mongoFieldNotNull(dbPath) : { [dbPath]: { $ne: value } },
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

        return negate ? { $nor: [positiveQuery] } : positiveQuery;
      },
    };
  }
}

function knexJsonSelector(dbPath, path) {
  if (path.length === 0) {
    return {
      json: '??',
      jsonArgs: [dbPath],
      text: '??',
      textArgs: [dbPath],
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
    const values = value.map(v => stringify(v));

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

function knexFieldNull(b, dbPath) {
  return b.whereNull(dbPath);
}

function knexFieldNotNull(b, dbPath) {
  return b.whereNotNull(dbPath);
}

function knexNotEqualOrNull(b, dbPath, value) {
  return b.where(q => {
    q.where(dbPath, '!=', value).orWhereNull(dbPath);
  });
}

function knexNotInOrNull(b, dbPath, values) {
  return b.where(q => {
    q.whereNotIn(dbPath, values).orWhereNull(dbPath);
  });
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

      // API null is DB NULL. We do not store root JSON null.
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
      [this.path]: value => b =>
        value === null ? knexFieldNull(b, dbPath) : b.where(dbPath, f(value)),

      [`${this.path}_not`]: value => b =>
        value === null ? knexFieldNotNull(b, dbPath) : knexNotEqualOrNull(b, dbPath, f(value)),
    };
  }

  inConditions(dbPath, f = stringify) {
    return {
      [`${this.path}_in`]: value => b => b.whereIn(dbPath, value.map(f)),

      [`${this.path}_not_in`]: value => b => knexNotInOrNull(b, dbPath, value.map(f)),
    };
  }

  matchConditions(dbPath) {
    return {
      [`${this.path}_match`]: value => b => {
        if (value === null || value === undefined) return b;

        this.field.validateMatchCondition(value);

        const { path, operator, value: expected, negate } = normalizeJsonMatchInput(value);

        const rootFieldNullMatch = getRootFieldNullMatch(path, value);

        if (rootFieldNullMatch === FIELD_NULL) {
          return knexFieldNull(b, dbPath);
        }

        if (rootFieldNullMatch === FIELD_NOT_NULL) {
          return knexFieldNotNull(b, dbPath);
        }

        const predicate = buildKnexPositiveJsonPredicate(dbPath, path, operator, expected);

        return applyKnexJsonPredicate(b, negate, predicate.sql, predicate.args);
      },
    };
  }
}

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

function prismaFieldNull(dbPath, { dbNull }) {
  return { [dbPath]: { equals: dbNull } };
}

function prismaFieldNotNull(dbPath, { dbNull }) {
  return { NOT: { [dbPath]: { equals: dbNull } } };
}

function prismaJsonValue(value, { jsonNull }) {
  return value === null ? jsonNull : value;
}

function buildPrismaPositiveJsonQuery(dbPath, path, operator, value, nulls) {
  if (operator === 'exists') {
    if (path.length === 0) {
      return { NOT: { [dbPath]: { equals: nulls.dbNull } } };
    }

    // Если Prisma не умеет честный path exists — лучше support error.
    // throw new Error(`JSON path exists is not supported by Prisma adapter`);
    // Actually, we can try path, NOT: { equals: dbNull } if path is supported.
    // But let's stick to the simplest thing that might work.
    return {
      AND: [{ NOT: { [dbPath]: { path, equals: nulls.dbNull } } }, { NOT: { [dbPath]: { equals: nulls.dbNull } } }],
    };
  }

  if (operator === 'equals') {
    if (path.length === 0 && value === null) {
      return { [dbPath]: { equals: nulls.dbNull } };
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
      OR: value.map(v => ({
        [dbPath]: {
          path,
          equals: v === null ? nulls.jsonNull : v,
        },
      })),
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

  matchConditions(dbPath) {
    return {
      [`${this.path}_match`]: value => {
        if (value === null || value === undefined) {
          return {};
        }
        this.field.validateMatchCondition(value);

        const nulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);
        const { path, operator, value: expected, negate } = normalizeJsonMatchInput(value);

        const rootFieldNullMatch = getRootFieldNullMatch(path, value);

        if (rootFieldNullMatch === FIELD_NULL) {
          return prismaFieldNull(dbPath, nulls);
        }

        if (rootFieldNullMatch === FIELD_NOT_NULL) {
          return prismaFieldNotNull(dbPath, nulls);
        }

        const positiveQuery = buildPrismaPositiveJsonQuery(dbPath, path, operator, expected, nulls);

        if (negate) {
          return {
            OR: [
              { NOT: positiveQuery },
              { [dbPath]: { path, equals: nulls.dbNull } },
              prismaFieldNull(dbPath, nulls),
            ],
          };
        }

        return positiveQuery;
      },
    };
  }
}
