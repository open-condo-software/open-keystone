import { KnexFieldAdapter } from '@open-keystone/adapter-knex';
import { MongooseFieldAdapter } from '@open-keystone/adapter-mongoose';
import { PrismaFieldAdapter } from '@open-keystone/adapter-prisma';
import { Implementation } from '../../Implementation';
import isFunction from 'lodash.isfunction';
import { escapeRegExp } from '@open-keystone/utils';

const stringify = JSON.stringify;

const FIELD_NULL = 'FIELD_NULL';
const FIELD_NOT_NULL = 'FIELD_NOT_NULL';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

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
      [this.path]: value =>
        value === null ? mongoFieldNull(dbPath) : { [dbPath]: { $eq: value } },

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
        const { path = [], ...conditions } = value;

        const rootFieldNullMatch = getRootFieldNullMatch(path, conditions);

        if (rootFieldNullMatch === FIELD_NULL) {
          return mongoFieldNull(dbPath);
        }

        if (rootFieldNullMatch === FIELD_NOT_NULL) {
          return mongoFieldNotNull(dbPath);
        }

        const targetPath = fullPath(dbPath, path);

        if ('equals' in conditions) {
          if (path.length > 0) {
            return {
              [dbPath]: { $exists: true, $ne: null },
              [targetPath]: conditions.equals === null ? { $type: 'null' } : conditions.equals,
            };
          }
          return { [targetPath]: conditions.equals };
        }
        if ('not' in conditions) {
          if (path.length > 0) {
            if (conditions.not === null) {
              return { [targetPath]: { $not: { $type: 10 } } };
            }
            return {
              $or: [{ [targetPath]: { $ne: conditions.not } }, { [targetPath]: { $exists: false } }, mongoFieldNull(dbPath)],
            };
          }
          return { [targetPath]: { $ne: conditions.not } };
        }
        if ('in' in conditions) {
          if (path.length > 0) {
            return {
              [dbPath]: { $exists: true, $ne: null },
              [targetPath]: { $in: conditions.in },
            };
          }
          return { [targetPath]: { $in: conditions.in } };
        }
        if ('not_in' in conditions) {
          if (path.length > 0) {
            return {
              $or: [{ [targetPath]: { $nin: conditions.not_in } }, { [targetPath]: { $exists: false } }],
            };
          }
          return { [targetPath]: { $nin: conditions.not_in } };
        }
        if ('exists' in conditions) {
          if (path.length === 0) {
            if (conditions.exists) {
              return { [targetPath]: { $exists: true, $ne: null } };
            } else {
              return { [targetPath]: null };
            }
          } else {
            if (conditions.exists) {
              return {
                [dbPath]: { $exists: true, $ne: null },
                [targetPath]: { $exists: true },
              };
            } else {
              return {
                $or: [{ [targetPath]: { $exists: false } }, { [dbPath]: null }],
              };
            }
          }
        }
        if ('number_lt' in conditions) {
          return { [targetPath]: { $lt: conditions.number_lt, $type: 'number' } };
        }
        if ('number_lte' in conditions) {
          return { [targetPath]: { $lte: conditions.number_lte, $type: 'number' } };
        }
        if ('number_gt' in conditions) {
          return { [targetPath]: { $gt: conditions.number_gt, $type: 'number' } };
        }
        if ('number_gte' in conditions) {
          return { [targetPath]: { $gte: conditions.number_gte, $type: 'number' } };
        }
        if ('string_contains' in conditions) {
          return {
            [targetPath]: {
              $regex: new RegExp(escapeRegExp(conditions.string_contains)),
              $type: 'string',
            },
          };
        }
        if ('string_not_contains' in conditions) {
          return {
            $or: [
              { [targetPath]: { $not: new RegExp(escapeRegExp(conditions.string_not_contains)) } },
              { [targetPath]: { $not: { $type: 'string' } } },
            ],
          };
        }
        if ('string_starts_with' in conditions) {
          return {
            [targetPath]: {
              $regex: new RegExp(`^${escapeRegExp(conditions.string_starts_with)}`),
              $type: 'string',
            },
          };
        }
        if ('string_not_starts_with' in conditions) {
          return {
            $or: [
              {
                [targetPath]: {
                  $not: new RegExp(`^${escapeRegExp(conditions.string_not_starts_with)}`),
                },
              },
              { [targetPath]: { $not: { $type: 'string' } } },
            ],
          };
        }
        if ('string_ends_with' in conditions) {
          return {
            [targetPath]: {
              $regex: new RegExp(`${escapeRegExp(conditions.string_ends_with)}$`),
              $type: 'string',
            },
          };
        }
        if ('string_not_ends_with' in conditions) {
          return {
            $or: [
              {
                [targetPath]: {
                  $not: new RegExp(`${escapeRegExp(conditions.string_not_ends_with)}$`),
                },
              },
              { [targetPath]: { $not: { $type: 'string' } } },
            ],
          };
        }
        if ('array_contains' in conditions) {
          return { [targetPath]: { $elemMatch: { $eq: conditions.array_contains } } };
        }
        if ('array_not_contains' in conditions) {
          return {
            $or: [
              { [targetPath]: { $not: { $elemMatch: { $eq: conditions.array_not_contains } } } },
              { [targetPath]: { $not: { $type: 'array' } } },
            ],
          };
        }

        return {};
      },
    };
  }
}

function fullPath(dbPath, path) {
  if (path.length === 0) return dbPath;
  return `${dbPath}.${path.join('.')}`;
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

        const { path = [], ...conditions } = value;

        const rootFieldNullMatch = getRootFieldNullMatch(path, conditions);

        if (rootFieldNullMatch === FIELD_NULL) {
          return knexFieldNull(b, dbPath);
        }

        if (rootFieldNullMatch === FIELD_NOT_NULL) {
          return knexFieldNotNull(b, dbPath);
        }

        const jsonSelector = path.length > 0 ? `?? #> ?` : `??`;
        const jsonArgs = path.length > 0 ? [dbPath, path] : [dbPath];

        const textSelector = path.length > 0 ? `?? #>> ?` : `??`;
        const textArgs = path.length > 0 ? [dbPath, path] : [dbPath];

        if ('equals' in conditions) {
          if (path.length > 0) {
            b.whereRaw(`(?? #> ? = ?::jsonb) IS TRUE`, [
              dbPath,
              path,
              stringify(conditions.equals),
            ]);
          } else {
            b.where(dbPath, stringify(conditions.equals));
          }

          return b;
        }

        if ('not' in conditions) {
          if (path.length > 0) {
            b.whereRaw(`(?? #> ? != ?::jsonb OR ?? #> ? IS NULL) IS TRUE`, [
              dbPath,
              path,
              stringify(conditions.not),
              dbPath,
              path,
            ]);
          } else {
            knexNotEqualOrNull(b, dbPath, stringify(conditions.not));
          }

          return b;
        }

        if ('in' in conditions) {
          const values = conditions.in.map(v => stringify(v));

          if (path.length > 0) {
            b.whereRaw(`(${jsonSelector} IN (${values.map(() => '?::jsonb').join(',')})) IS TRUE`, [
              ...jsonArgs,
              ...values,
            ]);
          } else {
            b.whereIn(dbPath, values);
          }

          return b;
        }

        if ('not_in' in conditions) {
          const values = conditions.not_in.map(v => stringify(v));

          if (path.length > 0) {
            b.whereRaw(
              `(${jsonSelector} NOT IN (${values
                .map(() => '?::jsonb')
                .join(',')}) OR ${jsonSelector} IS NULL) IS TRUE`,
              [...jsonArgs, ...values, ...jsonArgs]
            );
          } else {
            knexNotInOrNull(b, dbPath, values);
          }

          return b;
        }

        if ('exists' in conditions) {
          if (path.length > 0) {
            b.whereRaw(
              `jsonb_typeof(${jsonSelector}) IS ${conditions.exists ? 'NOT ' : ''}NULL`,
              jsonArgs
            );
          } else {
            conditions.exists ? knexFieldNotNull(b, dbPath) : knexFieldNull(b, dbPath);
          }

          return b;
        }

        if ('number_lt' in conditions) {
          b.whereRaw(
            `(jsonb_typeof(${jsonSelector}) = 'number' AND CAST(${textSelector} AS FLOAT) < ?)`,
            [...jsonArgs, ...textArgs, conditions.number_lt]
          );
          return b;
        }

        if ('number_lte' in conditions) {
          b.whereRaw(
            `(jsonb_typeof(${jsonSelector}) = 'number' AND CAST(${textSelector} AS FLOAT) <= ?)`,
            [...jsonArgs, ...textArgs, conditions.number_lte]
          );
          return b;
        }

        if ('number_gt' in conditions) {
          b.whereRaw(
            `(jsonb_typeof(${jsonSelector}) = 'number' AND CAST(${textSelector} AS FLOAT) > ?)`,
            [...jsonArgs, ...textArgs, conditions.number_gt]
          );
          return b;
        }

        if ('number_gte' in conditions) {
          b.whereRaw(
            `(jsonb_typeof(${jsonSelector}) = 'number' AND CAST(${textSelector} AS FLOAT) >= ?)`,
            [...jsonArgs, ...textArgs, conditions.number_gte]
          );
          return b;
        }

        if ('string_contains' in conditions) {
          b.whereRaw(`(jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} LIKE ?)`, [
            ...jsonArgs,
            ...textArgs,
            `%${conditions.string_contains}%`,
          ]);
          return b;
        }

        if ('string_not_contains' in conditions) {
          b.whereRaw(
            `(jsonb_typeof(${jsonSelector}) IS DISTINCT FROM 'string' OR ${textSelector} NOT LIKE ?)`,
            [...jsonArgs, ...textArgs, `%${conditions.string_not_contains}%`]
          );
          return b;
        }

        if ('string_starts_with' in conditions) {
          b.whereRaw(`(jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} LIKE ?)`, [
            ...jsonArgs,
            ...textArgs,
            `${conditions.string_starts_with}%`,
          ]);
          return b;
        }

        if ('string_not_starts_with' in conditions) {
          b.whereRaw(
            `(jsonb_typeof(${jsonSelector}) IS DISTINCT FROM 'string' OR ${textSelector} NOT LIKE ?)`,
            [...jsonArgs, ...textArgs, `${conditions.string_not_starts_with}%`]
          );
          return b;
        }

        if ('string_ends_with' in conditions) {
          b.whereRaw(`(jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} LIKE ?)`, [
            ...jsonArgs,
            ...textArgs,
            `%${conditions.string_ends_with}`,
          ]);
          return b;
        }

        if ('string_not_ends_with' in conditions) {
          b.whereRaw(
            `(jsonb_typeof(${jsonSelector}) IS DISTINCT FROM 'string' OR ${textSelector} NOT LIKE ?)`,
            [...jsonArgs, ...textArgs, `%${conditions.string_not_ends_with}`]
          );
          return b;
        }

        if ('array_contains' in conditions) {
          b.whereRaw(`(jsonb_typeof(${jsonSelector}) = 'array' AND ${jsonSelector} @> ?)`, [
            ...jsonArgs,
            ...jsonArgs,
            stringify([conditions.array_contains]),
          ]);
          return b;
        }

        if ('array_not_contains' in conditions) {
          b.whereRaw(
            `(jsonb_typeof(${jsonSelector}) IS DISTINCT FROM 'array' OR NOT (${jsonSelector} @> ?))`,
            [...jsonArgs, ...jsonArgs, stringify([conditions.array_not_contains])]
          );
          return b;
        }

        return b;
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
        const { path = [], ...conditions } = value;

        const nulls = getPrismaJsonNulls(this, `${this.field.listKey}.${this.path}`);
        const rootFieldNullMatch = getRootFieldNullMatch(path, conditions);

        if (rootFieldNullMatch === FIELD_NULL) {
          return prismaFieldNull(dbPath, nulls);
        }

        if (rootFieldNullMatch === FIELD_NOT_NULL) {
          return prismaFieldNotNull(dbPath, nulls);
        }

        if ('equals' in conditions) {
          return {
            [dbPath]: {
              path,
              equals: prismaJsonValue(conditions.equals, nulls),
            },
          };
        }
        if ('not' in conditions) {
          return {
            NOT: {
              [dbPath]: {
                path,
                equals: prismaJsonValue(conditions.not, nulls),
              },
            },
          };
        }
        if ('in' in conditions) {
          return {
            OR: conditions.in.map(value => ({
              [dbPath]: { path, equals: prismaJsonValue(value, nulls) },
            })),
          };
        }
        if ('not_in' in conditions) {
          return {
            AND: conditions.not_in.map(value => ({
              NOT: { [dbPath]: { path, equals: prismaJsonValue(value, nulls) } },
            })),
          };
        }
        if ('exists' in conditions) {
          if (conditions.exists) {
            return {
              AND: [{ NOT: { [dbPath]: { path, equals: nulls.dbNull } } }, prismaFieldNotNull(dbPath, nulls)],
            };
          } else {
            return {
              OR: [{ [dbPath]: { path, equals: nulls.dbNull } }, prismaFieldNull(dbPath, nulls)],
            };
          }
        }
        if ('number_lt' in conditions) {
          return { [dbPath]: { path, lt: conditions.number_lt } };
        }
        if ('number_lte' in conditions) {
          return { [dbPath]: { path, lte: conditions.number_lte } };
        }
        if ('number_gt' in conditions) {
          return { [dbPath]: { path, gt: conditions.number_gt } };
        }
        if ('number_gte' in conditions) {
          return { [dbPath]: { path, gte: conditions.number_gte } };
        }
        if ('string_contains' in conditions) {
          return { [dbPath]: { path, string_contains: conditions.string_contains } };
        }
        if ('string_not_contains' in conditions) {
          return {
            NOT: { [dbPath]: { path, string_contains: conditions.string_not_contains } },
          };
        }
        if ('string_starts_with' in conditions) {
          return { [dbPath]: { path, string_starts_with: conditions.string_starts_with } };
        }
        if ('string_not_starts_with' in conditions) {
          return {
            NOT: { [dbPath]: { path, string_starts_with: conditions.string_not_starts_with } },
          };
        }
        if ('string_ends_with' in conditions) {
          return { [dbPath]: { path, string_ends_with: conditions.string_ends_with } };
        }
        if ('string_not_ends_with' in conditions) {
          return {
            NOT: { [dbPath]: { path, string_ends_with: conditions.string_not_ends_with } },
          };
        }
        if ('array_contains' in conditions) {
          return { [dbPath]: { path, array_contains: [conditions.array_contains] } };
        }
        if ('array_not_contains' in conditions) {
          return {
            NOT: { [dbPath]: { path, array_contains: [conditions.array_not_contains] } },
          };
        }

        return {};
      },
    };
  }
}
