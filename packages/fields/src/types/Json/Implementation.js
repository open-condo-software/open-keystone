import { KnexFieldAdapter } from '@open-keystone/adapter-knex';
import { MongooseFieldAdapter } from '@open-keystone/adapter-mongoose';
import { PrismaFieldAdapter } from '@open-keystone/adapter-prisma';
import { Implementation } from '../../Implementation';
import isFunction from 'lodash.isfunction';
import { identity, escapeRegExp } from '@open-keystone/utils';

const stringify = JSON.stringify;

const JSON_PATH_SEGMENT_REGEX = /^(?!(?:__proto__|prototype|constructor|__typename)$)(?:[_A-Za-z][_A-Za-z0-9]*|0|[1-9][0-9]{0,3})$/;

export class Json extends Implementation {
    // NOTE: argument names are based no Virtual field
    constructor (path, {
        isMultiline,
        graphQLInputType = 'JSON',
        graphQLReturnType = 'JSON',
        extendGraphQLTypes = [],
        graphQLAdminFragment = '',
    }) {
        super(...arguments)
        this.isMultiline = isMultiline
        this.isOrderable = false
        this.graphQLInputType = graphQLInputType
        this.graphQLReturnType = graphQLReturnType
        this.extendGraphQLTypes = extendGraphQLTypes
        this.graphQLAdminFragment = graphQLAdminFragment
    }

    get _supportsUnique() {
        return false;
    }

    // GQL Output

    gqlOutputFields () {
        return [`${this.path}: ${this.graphQLReturnType}`]
    }

    gqlOutputFieldResolvers () {
        return {
            [`${this.path}`]: item => item[this.path],
        }
    }

    // GQL Input

    gqlQueryInputFields () {
        return [
            ...this.equalityInputFields(this.graphQLInputType),
            ...this.inInputFields(this.graphQLInputType),
            `${this.path}_match: JsonMatchInput`,
        ]
    }

    gqlUpdateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    gqlCreateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    // GQL Auxiliary

    /**
     * Auxiliary Types are top-level types which a type may need or provide.
     * Example: the `File` type, adds a graphql auxiliary type of `FileUpload`, as
     * well as an `uploadFile()` graphql auxiliary type query resolver
     */

    getGqlAuxTypes () {
        return [
            ...this.extendGraphQLTypes,
            `input JsonMatchInput {
                path: [String!]
                equals: JSON
                not: JSON
                in: [JSON!]
                not_in: [JSON!]
                exists: Boolean
                is_null: Boolean
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
            }`,
        ]
    }

    gqlAuxFieldResolvers (args) {
        const { schemaName } = args
        if (isFunction(this.config.gqlAuxFieldResolver)) {
            return this.config.gqlAuxFieldResolver(args)
        }

        return super.gqlAuxFieldResolvers({ schemaName })
    }

    // Admin

    extendAdminMeta (meta) {
        const { isMultiline } = this
        return {
            isMultiline,
            graphQLAdminFragment: this.graphQLAdminFragment,
            ...meta,
        }
    }

    // Hooks

    async resolveInput ({ resolvedData }) {
        return resolvedData[this.path]
    }

    validateMatchCondition (value) {
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
                    throw new Error(`Invalid JSON path segment "${segment}" for ${this.listKey}.${this.path}. Segment must be a string.`);
                }
                if (!JSON_PATH_SEGMENT_REGEX.test(segment)) {
                    throw new Error(`Invalid JSON path segment "${segment}" for ${this.listKey}.${this.path}`);
                }
            }
        }

        const conditionKeys = Object.keys(conditions).filter(k => conditions[k] !== undefined);
        if (conditionKeys.length > 1) {
            throw new Error(`Only one condition can be used in JsonMatchInput for ${this.listKey}.${this.path}`);
        }
        if (conditionKeys.length === 0) {
            throw new Error(`At least one condition must be used in JsonMatchInput for ${this.listKey}.${this.path}`);
        }
    }
}

const CommonFieldAdapterInterface = superclass =>
    class extends superclass {
        getQueryConditions (dbPath) {
            return {
                ...this.equalityConditions(dbPath),
                ...this.inConditions(dbPath),
                ...this.matchConditions(dbPath),
            }
        }

        matchConditions () {
            return {
                [`${this.path}_match`]: () => {
                    throw new Error(
                        `Filter ${this.path}_match is not supported by the ${this.listAdapter.parentAdapter.name} adapter`
                    );
                },
            };
        }
    }

export class MongoJsonInterface extends CommonFieldAdapterInterface(MongooseFieldAdapter) {
    /*
     * @param {mongoose.Schema} schema
     */
    addToMongooseSchema (schema) {
        const schemaOptions = {
            type: Object,
        }
        schema.add({ [this.path]: this.mergeSchemaOptions(schemaOptions, this.config) })
        schema.set('strict', false)
    }

    matchConditions (dbPath) {
        return {
            [`${this.path}_match`]: value => {
                if (value === null || value === undefined) {
                    return {};
                }
                this.field.validateMatchCondition(value);
                const { path = [], ...conditions } = value;
                const query = {};
                const targetPath = fullPath(dbPath, path);

                if ('equals' in conditions) {
                    query[targetPath] = conditions.equals;
                }
                if ('not' in conditions) {
                    query[targetPath] = { $ne: conditions.not };
                }
                if ('in' in conditions) {
                    query[targetPath] = { $in: conditions.in };
                }
                if ('not_in' in conditions) {
                    query[targetPath] = { $nin: conditions.not_in };
                }
                if ('exists' in conditions) {
                    if (conditions.exists) {
                        query[targetPath] = { $exists: true };
                    } else {
                        query[targetPath] = { $exists: false };
                    }
                }
                if ('is_null' in conditions) {
                    if (conditions.is_null) {
                        query[targetPath] = { $type: 'null' };
                    } else {
                        query[targetPath] = { $not: { $type: 'null' }, $exists: true };
                    }
                }
                if ('lt' in conditions) {
                    query[targetPath] = { $type: 'number', $lt: conditions.lt };
                }
                if ('lte' in conditions) {
                    query[targetPath] = { $type: 'number', $lte: conditions.lte };
                }
                if ('gt' in conditions) {
                    query[targetPath] = { $type: 'number', $gt: conditions.gt };
                }
                if ('gte' in conditions) {
                    query[targetPath] = { $type: 'number', $gte: conditions.gte };
                }
                if ('string_contains' in conditions) {
                    query[targetPath] = { $type: 'string', $regex: new RegExp(escapeRegExp(conditions.string_contains)) };
                }
                if ('string_not_contains' in conditions) {
                    query[targetPath] = { $type: 'string', $not: new RegExp(escapeRegExp(conditions.string_not_contains)) };
                }
                if ('string_starts_with' in conditions) {
                    query[targetPath] = { $type: 'string', $regex: new RegExp(`^${escapeRegExp(conditions.string_starts_with)}`) };
                }
                if ('string_not_starts_with' in conditions) {
                    query[targetPath] = { $type: 'string', $not: new RegExp(`^${escapeRegExp(conditions.string_not_starts_with)}`) };
                }
                if ('string_ends_with' in conditions) {
                    query[targetPath] = { $type: 'string', $regex: new RegExp(`${escapeRegExp(conditions.string_ends_with)}$`) };
                }
                if ('string_not_ends_with' in conditions) {
                    query[targetPath] = { $type: 'string', $not: new RegExp(`${escapeRegExp(conditions.string_not_ends_with)}$`) };
                }
                if ('array_contains' in conditions) {
                    query[targetPath] = { $type: 'array', $elemMatch: { $eq: conditions.array_contains } };
                }

                return query;
            },
        };
    }
}

function fullPath(dbPath, path) {
    if (path.length === 0) return dbPath;
    return `${dbPath}.${path.join('.')}`;
}

function fullPathExists(dbPath, path) {
    if (path.length === 0) return dbPath;
    const pathParts = path.join('.').split('.');
    return `${dbPath}.${pathParts.join('.')}`;
}

export class KnexJsonInterface extends CommonFieldAdapterInterface(KnexFieldAdapter) {
    constructor () {
        super(...arguments)

        // Error rather than ignoring invalid config
        // We totally can index these values, it's just not trivial. See issue #1297
        if (this.config.isUnique || this.config.isIndexed) {
            throw "The Location field type doesn't support indexes on Knex. " +
            `Check the config for ${this.path} on the ${this.field.listKey} list`
        }
    }

    setupHooks ({ addPreSaveHook, addPostReadHook }) {
        addPreSaveHook(item => {
            // Only run the hook if the item actually contains the field
            // NOTE: Can't use hasOwnProperty here
            if (!(this.path in item)) {
                return item
            }

            // ref#PGDB/NULL: convert null to 'null' as pgdb json value!
            // NOTE: there are two types of null in PGDB! null as JSON field value and null as DB default NULL value!
            item[this.path] = stringify(item[this.path])
            return item
        })
    }

    addToTableSchema (table) {
        const column = table.jsonb(this.path)
        if (this.isNotNullable) column.notNullable()
        if (this.defaultTo) column.defaultTo(this.defaultTo)
    }

    inConditions (dbPath, f = stringify) {
        // ref#PGDB/NULL: convert null to 'null' as pgdb json value!
        return {
            [`${this.path}_in`]: value => b =>
                value.includes(null)
                    ? b.whereIn(dbPath, value.map(f)).orWhereNull(dbPath)
                    : b.whereIn(dbPath, value.map(f)),
            [`${this.path}_not_in`]: value => b =>
                value.includes(null)
                    ? b.whereNotIn(dbPath, value.map(f)).whereNotNull(dbPath)
                    : b.whereNotIn(dbPath, value.map(f)).orWhereNull(dbPath),
        }
    }

    equalityConditions (dbPath, f = stringify) {
        // ref#PGDB/NULL: convert null to 'null' as pgdb json value!
        return {
            [this.path]: value => b =>
                value === null ?
                    b.where(dbPath, f(value)).orWhereNull(dbPath) :
                    b.where(dbPath, f(value)),
            [`${this.path}_not`]: value => b =>
                value === null
                    ? b.whereNotNull(dbPath).where(dbPath, '!=', f(value))
                    : b.where(dbPath, '!=', f(value)).orWhereNull(dbPath),
        }
    }

    matchConditions (dbPath) {
        return {
            [`${this.path}_match`]: value => b => {
                if (value === null || value === undefined) {
                    return b;
                }
                this.field.validateMatchCondition(value);
                const { path = [], ...conditions } = value;

                const jsonSelector = path.length > 0 ? `?? #> ?` : `??`;
                const jsonArgs = path.length > 0 ? [dbPath, path] : [dbPath];

                const textSelector = path.length > 0 ? `?? #>> ?` : `??`;
                const textArgs = path.length > 0 ? [dbPath, path] : [dbPath];

                if ('equals' in conditions) {
                    if (path.length > 0) {
                        b.whereRaw(`${textSelector} = ?`, [...textArgs, stringify(conditions.equals).replace(/^"|"$/g, '')]);
                    } else {
                        b.where(dbPath, stringify(conditions.equals));
                    }
                }
                if ('not' in conditions) {
                    if (path.length > 0) {
                        b.whereRaw(`${textSelector} != ?`, [...textArgs, stringify(conditions.not).replace(/^"|"$/g, '')]);
                    } else {
                        b.where(dbPath, '!=', stringify(conditions.not));
                    }
                }
                if ('in' in conditions) {
                    const values = conditions.in.map(v => stringify(v).replace(/^"|"$/g, ''));
                    if (path.length > 0) {
                        b.whereRaw(`${textSelector} IN (${values.map(() => '?').join(',')})`, [...textArgs, ...values]);
                    } else {
                        b.whereIn(dbPath, conditions.in.map(v => stringify(v)));
                    }
                }
                if ('not_in' in conditions) {
                    const values = conditions.not_in.map(v => stringify(v).replace(/^"|"$/g, ''));
                    if (path.length > 0) {
                        b.whereRaw(`${textSelector} NOT IN (${values.map(() => '?').join(',')})`, [...textArgs, ...values]);
                    } else {
                        b.whereNotIn(dbPath, conditions.not_in.map(v => stringify(v)));
                    }
                }
                if ('exists' in conditions) {
                    if (path.length > 0) {
                        if (conditions.exists) {
                            b.whereRaw(`${jsonSelector} IS NOT NULL`, jsonArgs);
                        } else {
                            b.whereRaw(`${jsonSelector} IS NULL`, jsonArgs);
                        }
                    } else {
                        if (conditions.exists) {
                            b.whereNotNull(dbPath);
                        } else {
                            b.whereNull(dbPath);
                        }
                    }
                }
                if ('is_null' in conditions) {
                    if (path.length > 0) {
                        if (conditions.is_null) {
                            b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'null'`, jsonArgs);
                        } else {
                            b.whereRaw(`jsonb_typeof(${jsonSelector}) != 'null'`, jsonArgs);
                        }
                    } else {
                        if (conditions.is_null) {
                            b.where(dbPath, 'null').orWhereNull(dbPath);
                        } else {
                            b.whereNotNull(dbPath).where(dbPath, '!=', 'null');
                        }
                    }
                }
                if ('lt' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'number' AND CAST(${textSelector} AS FLOAT) < ?`, [...jsonArgs, ...textArgs, conditions.lt]);
                }
                if ('lte' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'number' AND CAST(${textSelector} AS FLOAT) <= ?`, [...jsonArgs, ...textArgs, conditions.lte]);
                }
                if ('gt' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'number' AND CAST(${textSelector} AS FLOAT) > ?`, [...jsonArgs, ...textArgs, conditions.gt]);
                }
                if ('gte' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'number' AND CAST(${textSelector} AS FLOAT) >= ?`, [...jsonArgs, ...textArgs, conditions.gte]);
                }
                if ('string_contains' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} LIKE ?`, [...jsonArgs, ...textArgs, `%${conditions.string_contains}%`]);
                }
                if ('string_not_contains' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} NOT LIKE ?`, [...jsonArgs, ...textArgs, `%${conditions.string_not_contains}%`]);
                }
                if ('string_starts_with' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} LIKE ?`, [...jsonArgs, ...textArgs, `${conditions.string_starts_with}%`]);
                }
                if ('string_not_starts_with' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} NOT LIKE ?`, [...jsonArgs, ...textArgs, `${conditions.string_not_starts_with}%`]);
                }
                if ('string_ends_with' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} LIKE ?`, [...jsonArgs, ...textArgs, `%${conditions.string_ends_with}`]);
                }
                if ('string_not_ends_with' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'string' AND ${textSelector} NOT LIKE ?`, [...jsonArgs, ...textArgs, `%${conditions.string_not_ends_with}`]);
                }
                if ('array_contains' in conditions) {
                    b.whereRaw(`jsonb_typeof(${jsonSelector}) = 'array' AND ${jsonSelector} @> ?`, [...jsonArgs, ...jsonArgs, stringify([conditions.array_contains])]);
                }

                return b;
            },
        };
    }
}

export class PrismaJsonInterface extends CommonFieldAdapterInterface(PrismaFieldAdapter) {
    getPrismaSchema () {
        return [this._schemaField({ type: 'Json' })]
    }

    equalityConditions (dbPath, f = identity) {
        const dbNull = this?.listAdapter?.parentAdapter?.prisma?.DbNull || null;
        return {
            [this.path]: value =>
                value === null
                    ? { OR: [{ [dbPath]: { equals: null } }, { [dbPath]: { equals: dbNull } }] }
                    : { [dbPath]: { equals: value } },
            [`${this.path}_not`]: value =>
                value === null
                    ? { NOT: { OR: [{ [dbPath]: { equals: null } }, { [dbPath]: { equals: dbNull } }] } }
                    : {
                        OR: [{ NOT: { [dbPath]: { equals: value } } }, { [dbPath]: { equals: null } }, { [dbPath]: { equals: dbNull } }],
                    },
        }
    }

    matchConditions (dbPath) {
        return {
            [`${this.path}_match`]: value => {
                if (value === null || value === undefined) {
                    return {};
                }
                this.field.validateMatchCondition(value);
                const { path = [], ...conditions } = value;
                const query = {};

                if ('equals' in conditions) {
                    query[dbPath] = { path, equals: conditions.equals };
                }
                if ('not' in conditions) {
                    query[dbPath] = { path, not: conditions.not };
                }
                if ('in' in conditions) {
                    query[dbPath] = { path, in: conditions.in };
                }
                if ('not_in' in conditions) {
                    query[dbPath] = { path, not_in: conditions.not_in };
                }
                if ('exists' in conditions) {
                    // Prisma doesn't have a direct 'exists' for JSON paths in this version.
                    // We can't easily implement this without raw queries or better Prisma support.
                }
                if ('is_null' in conditions) {
                    if (conditions.is_null) {
                        query[dbPath] = { path, equals: null };
                    } else {
                        query[dbPath] = { path, not: null };
                    }
                }
                
                // Prisma supports type-specific filtering in some versions.
                if ('lt' in conditions) {
                    query[dbPath] = { path, lt: conditions.lt };
                }
                if ('lte' in conditions) {
                    query[dbPath] = { path, lte: conditions.lte };
                }
                if ('gt' in conditions) {
                    query[dbPath] = { path, gt: conditions.gt };
                }
                if ('gte' in conditions) {
                    query[dbPath] = { path, gte: conditions.gte };
                }
                if ('string_contains' in conditions) {
                    query[dbPath] = { path, string_contains: conditions.string_contains };
                }
                if ('string_not_contains' in conditions) {
                    query[dbPath] = { path, string_not_contains: conditions.string_not_contains };
                }
                if ('string_starts_with' in conditions) {
                    query[dbPath] = { path, string_starts_with: conditions.string_starts_with };
                }
                if ('string_not_starts_with' in conditions) {
                    query[dbPath] = { path, string_not_starts_with: conditions.string_not_starts_with };
                }
                if ('string_ends_with' in conditions) {
                    query[dbPath] = { path, string_ends_with: conditions.string_ends_with };
                }
                if ('string_not_ends_with' in conditions) {
                    query[dbPath] = { path, string_not_ends_with: conditions.string_not_ends_with };
                }
                if ('array_contains' in conditions) {
                    query[dbPath] = { path, array_contains: conditions.array_contains };
                }

                return query;
            },
        };
    }
}

