export const FIELD_NULL = 'FIELD_NULL';
export const FIELD_NOT_NULL = 'FIELD_NOT_NULL';

export const DEFAULT_JSON_FILTER_LIMITS = {
  maxWhereDepth: 12,
  maxWhereKeys: 100,
  maxLogicalItems: 50,

  maxPathDepth: 8,
  maxPathSegmentLength: 64,

  maxListLength: 100,
  maxStringLength: 1024,

  maxJsonDepth: 16,
  maxObjectKeys: 100,
  maxObjectKeyLength: 128,

  maxObjectPatternDepth: 8,
};

const JSON_PATH_KEY_SEGMENT_REGEX =
  /^(?!(?:__proto__|prototype|constructor|__typename)$)[_A-Za-z][_A-Za-z0-9]*$/;

const JSON_PATH_INDEX_SEGMENT_REGEX = /^(?:0|[1-9][0-9]{0,3})$/;

const JSON_OBJECT_PATTERN_KEY_REGEX =
  /^(?!(?:__proto__|prototype|constructor|__typename)$)[_A-Za-z][_A-Za-z0-9]*$/;

const JSON_MATCH_OPERATORS = new Set([
  'equals',
  'not',
  'in',
  'not_in',

  'exists',

  'number_lt',
  'number_lte',
  'number_gt',
  'number_gte',

  'string_contains',
  'string_not_contains',
  'string_starts_with',
  'string_not_starts_with',
  'string_ends_with',
  'string_not_ends_with',

  'array_contains',
  'array_not_contains',
]);

const NEGATED_OPERATOR = {
  not: 'equals',
  not_in: 'in',

  string_not_contains: 'string_contains',
  string_not_starts_with: 'string_starts_with',
  string_not_ends_with: 'string_ends_with',

  array_not_contains: 'array_contains',
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const isPlainObject = value => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const fail = message => {
  const error = new Error(message);
  error.code = 'BAD_USER_INPUT';
  throw error;
};

const makeCtx = ctx => ({
  listKey: ctx.listKey || 'UnknownList',
  fieldPath: ctx.fieldPath || ctx.path || 'unknownJsonField',

  allowedPaths: ctx.allowedPaths,

  // For JsonMatchInput.in / not_in.
  // Keep false for GraphQL `in: [JSON!]`.
  // Set true only if schema is intentionally changed to `in: [JSON]`.
  allowNullInLists: ctx.allowNullInLists === true,

  // Needed when object values inside array_contains / array_not_contains are
  // translated into Mongo object-pattern queries.
  validateArrayObjectPattern: ctx.validateArrayObjectPattern !== false,

  // Literal JSON values may legally contain "$ne", dots, etc.
  // Turn this off only if you want a stricter but less JSON-compatible API.
  allowUnsafeLiteralObjectKeys: ctx.allowUnsafeLiteralObjectKeys !== false,

  limits: {
    ...DEFAULT_JSON_FILTER_LIMITS,
    ...(ctx.limits || {}),
  },
});

export function validateJsonMatchInput(input, rawCtx = {}) {
  const ctx = makeCtx(rawCtx);

  if (input === null || input === undefined) {
    return null;
  }

  if (!isPlainObject(input)) {
    fail(`JsonMatchInput must be an object for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  const path = validateJsonPath(input.path, ctx);

  const operatorKeys = Object.keys(input).filter(key => key !== 'path' && input[key] !== undefined);

  if (operatorKeys.length === 0) {
    fail(`One condition is required in JsonMatchInput for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  if (operatorKeys.length > 1) {
    fail(
      `Only one condition can be used in JsonMatchInput for ${ctx.listKey}.${ctx.fieldPath}. Use OR / AND to combine conditions.`
    );
  }

  const operator = operatorKeys[0];
  const value = input[operator];

  if (!JSON_MATCH_OPERATORS.has(operator)) {
    fail(`Unknown JSON match operator "${operator}" for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  validateJsonOperatorValue(operator, value, ctx);

  return { path, operator, value };
}

export function normalizeJsonMatchInput(input, rawCtx = {}) {
  const validated = validateJsonMatchInput(input, rawCtx);
  if (validated === null) return null;

  const { path, operator, value } = validated;

  if (operator === 'exists') {
    return {
      path,
      operator: 'exists',
      value: true,
      negate: value === false,
    };
  }

  if (hasOwn(NEGATED_OPERATOR, operator)) {
    return {
      path,
      operator: NEGATED_OPERATOR[operator],
      value,
      negate: true,
    };
  }

  return {
    path,
    operator,
    value,
    negate: false,
  };
}

export function getRootFieldNullMatch(normalizedMatchInput) {
  if (!normalizedMatchInput || normalizedMatchInput.path.length > 0) {
    return null;
  }

  const { operator, value, negate } = normalizedMatchInput;

  if (operator === 'exists') {
    return negate ? FIELD_NULL : FIELD_NOT_NULL;
  }

  if (operator === 'equals' && value === null) {
    return negate ? FIELD_NOT_NULL : FIELD_NULL;
  }

  return null;
}

export function validateJsonFieldValue(value, rawCtx = {}) {
  const ctx = makeCtx(rawCtx);
  validateJsonValue(value, ctx);
}

export function validateJsonFieldListFilter(value, operatorName, rawCtx = {}) {
  const ctx = makeCtx({
    ...rawCtx,
    // Whole-field metadata_in / metadata_not_in may intentionally support null.
    allowNullInLists: rawCtx.allowNullInLists !== false,
  });

  validateJsonList(value, operatorName, ctx);
}

export function validateJsonWhereInput(where, rawCtx = {}, depth = 0) {
  const ctx = makeCtx(rawCtx);
  const { jsonFields = {} } = rawCtx;

  if (where === null || where === undefined) {
    return;
  }

  if (!isPlainObject(where)) {
    fail(`WhereInput must be an object for ${ctx.listKey}`);
  }

  if (depth > ctx.limits.maxWhereDepth) {
    fail(`WhereInput is too deep for ${ctx.listKey}`);
  }

  const keys = Object.keys(where);

  if (keys.length > ctx.limits.maxWhereKeys) {
    fail(`WhereInput has too many conditions for ${ctx.listKey}`);
  }

  for (const key of keys) {
    const value = where[key];

    if (key === 'AND' || key === 'OR') {
      validateLogicalBranch(key, value, rawCtx, depth);
      continue;
    }

    if (key === 'NOT') {
      fail(`NOT is not supported in ${ctx.listKey} WhereInput`);
    }

    for (const [fieldPath, fieldConfig] of Object.entries(jsonFields)) {
      const fieldCtx = {
        ...rawCtx,
        ...fieldConfig,
        listKey: ctx.listKey,
        fieldPath,
      };

      if (key === fieldPath || key === `${fieldPath}_not`) {
        validateJsonFieldValue(value, fieldCtx);
        break;
      }

      if (key === `${fieldPath}_in` || key === `${fieldPath}_not_in`) {
        validateJsonFieldListFilter(value, key, {
          ...fieldCtx,
          allowNullInLists: fieldConfig.allowNullInFieldLists !== false,
        });
        break;
      }

      if (key === `${fieldPath}_match`) {
        validateJsonMatchInput(value, {
          ...fieldCtx,
          allowNullInLists: fieldConfig.allowNullInMatchLists === true,
        });
        break;
      }
    }
  }
}

function validateLogicalBranch(key, value, rawCtx, depth) {
  const ctx = makeCtx(rawCtx);

  if (!Array.isArray(value)) {
    fail(`${key} must be an array for ${ctx.listKey}`);
  }

  if (value.length === 0) {
    fail(`${key} must be a non-empty array for ${ctx.listKey}`);
  }

  if (value.length > ctx.limits.maxLogicalItems) {
    fail(`${key} has too many items for ${ctx.listKey}`);
  }

  for (const item of value) {
    validateJsonWhereInput(item, rawCtx, depth + 1);
  }
}

function validateJsonPath(path, ctx) {
  if (path === undefined) {
    return [];
  }

  if (path === null || !Array.isArray(path)) {
    fail(`JSON path must be an array of strings for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  if (path.length === 0) {
    fail(`JSON path cannot be empty for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  if (path.length > ctx.limits.maxPathDepth) {
    fail(`JSON path is too deep for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  for (const segment of path) {
    validateJsonPathSegment(segment, ctx);
  }

  if (ctx.allowedPaths) {
    const isAllowed = ctx.allowedPaths.some(allowedPath => {
      if (allowedPath.length !== path.length) return false;
      return allowedPath.every((segment, index) => segment === path[index]);
    });

    if (!isAllowed) {
      fail(`JSON path ${JSON.stringify(path)} is not allowed for ${ctx.listKey}.${ctx.fieldPath}`);
    }
  }

  return path;
}

function validateJsonPathSegment(segment, ctx) {
  if (typeof segment !== 'string') {
    fail(
      `Invalid JSON path segment "${segment}" for ${ctx.listKey}.${ctx.fieldPath}. Segment must be a string.`
    );
  }

  if (segment.length === 0 || segment.length > ctx.limits.maxPathSegmentLength) {
    fail(`Invalid JSON path segment "${segment}" for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  const isObjectKey = JSON_PATH_KEY_SEGMENT_REGEX.test(segment);
  const isArrayIndex = JSON_PATH_INDEX_SEGMENT_REGEX.test(segment);

  if (!isObjectKey && !isArrayIndex) {
    fail(`Invalid JSON path segment "${segment}" for ${ctx.listKey}.${ctx.fieldPath}`);
  }
}

function validateJsonOperatorValue(operator, value, ctx) {
  if (operator === 'exists') {
    if (typeof value !== 'boolean') {
      fail(`exists must be a boolean for ${ctx.listKey}.${ctx.fieldPath}`);
    }
    return;
  }

  if (operator === 'in' || operator === 'not_in') {
    validateJsonList(value, operator, ctx);
    return;
  }

  if (operator.startsWith('number_')) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      fail(`${operator} must be a finite number for ${ctx.listKey}.${ctx.fieldPath}`);
    }
    return;
  }

  if (operator.startsWith('string_')) {
    if (typeof value !== 'string') {
      fail(`${operator} must be a string for ${ctx.listKey}.${ctx.fieldPath}`);
    }

    if (value.length > ctx.limits.maxStringLength) {
      fail(`${operator} is too long for ${ctx.listKey}.${ctx.fieldPath}`);
    }

    return;
  }

  if (
    operator === 'equals' ||
    operator === 'not' ||
    operator === 'array_contains' ||
    operator === 'array_not_contains'
  ) {
    validateJsonValue(value, ctx);

    if (
      ctx.validateArrayObjectPattern &&
      (operator === 'array_contains' || operator === 'array_not_contains') &&
      isPlainObject(value)
    ) {
      validateJsonObjectPattern(value, ctx);
    }

    return;
  }

  fail(`Unsupported JSON match operator "${operator}" for ${ctx.listKey}.${ctx.fieldPath}`);
}

function validateJsonList(value, operatorName, ctx) {
  if (!Array.isArray(value)) {
    fail(`${operatorName} must be an array for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  if (value.length === 0) {
    fail(`${operatorName} must be a non-empty array for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  if (value.length > ctx.limits.maxListLength) {
    fail(`${operatorName} has too many items for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  for (const item of value) {
    if (item === null && !ctx.allowNullInLists) {
      fail(`${operatorName} cannot contain null for ${ctx.listKey}.${ctx.fieldPath}`);
    }

    validateJsonValue(item, ctx);
  }
}

function validateJsonValue(value, ctx, depth = 0, seen = new WeakSet()) {
  if (depth > ctx.limits.maxJsonDepth) {
    fail(`JSON value is too deep for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  if (value === null) return;

  const type = typeof value;

  if (type === 'string') {
    if (value.length > ctx.limits.maxStringLength) {
      fail(`JSON string value is too long for ${ctx.listKey}.${ctx.fieldPath}`);
    }
    return;
  }

  if (type === 'number') {
    if (!Number.isFinite(value)) {
      fail(`JSON number value must be finite for ${ctx.listKey}.${ctx.fieldPath}`);
    }
    return;
  }

  if (type === 'boolean') return;

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      fail(`Circular JSON array value is not supported for ${ctx.listKey}.${ctx.fieldPath}`);
    }

    seen.add(value);

    if (value.length > ctx.limits.maxListLength) {
      fail(`JSON array value has too many items for ${ctx.listKey}.${ctx.fieldPath}`);
    }

    for (const item of value) {
      validateJsonValue(item, ctx, depth + 1, seen);
    }

    seen.delete(value);
    return;
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) {
      fail(`Circular JSON object value is not supported for ${ctx.listKey}.${ctx.fieldPath}`);
    }

    seen.add(value);

    const keys = Object.keys(value);

    if (keys.length > ctx.limits.maxObjectKeys) {
      fail(`JSON object value has too many keys for ${ctx.listKey}.${ctx.fieldPath}`);
    }

    for (const key of keys) {
      if (key.length > ctx.limits.maxObjectKeyLength) {
        fail(`JSON object key is too long for ${ctx.listKey}.${ctx.fieldPath}`);
      }

      if (!ctx.allowUnsafeLiteralObjectKeys && !JSON_OBJECT_PATTERN_KEY_REGEX.test(key)) {
        fail(`Invalid JSON object key "${key}" for ${ctx.listKey}.${ctx.fieldPath}`);
      }

      validateJsonValue(value[key], ctx, depth + 1, seen);
    }

    seen.delete(value);
    return;
  }

  fail(`Unsupported JSON value type for ${ctx.listKey}.${ctx.fieldPath}`);
}

function validateJsonObjectPattern(value, ctx, depth = 0) {
  if (depth > ctx.limits.maxObjectPatternDepth) {
    fail(`JSON object pattern is too deep for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  if (!isPlainObject(value)) return;

  const keys = Object.keys(value);

  if (keys.length > ctx.limits.maxObjectKeys) {
    fail(`JSON object pattern has too many keys for ${ctx.listKey}.${ctx.fieldPath}`);
  }

  for (const key of keys) {
    if (!JSON_OBJECT_PATTERN_KEY_REGEX.test(key)) {
      fail(`Invalid JSON object key "${key}" for ${ctx.listKey}.${ctx.fieldPath}`);
    }

    validateJsonValue(value[key], ctx, depth + 1);
    validateJsonObjectPattern(value[key], ctx, depth + 1);
  }
}
