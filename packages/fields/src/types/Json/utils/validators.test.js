// jsonFilterValidation.test.js

import {
  FIELD_NULL,
  FIELD_NOT_NULL,
  validateJsonMatchInput,
  normalizeJsonMatchInput,
  getRootFieldNullMatch,
  validateJsonFieldValue,
  validateJsonFieldListFilter,
  validateJsonWhereInput,
} from './validators';

const ctx = {
  listKey: 'User',
  fieldPath: 'metadata',
  allowedPaths: [
    ['profile', 'country'],
    ['profile', 'age'],
    ['profile', 'email'],
    ['profile', 'middleName'],
    ['tags'],
    ['tags', '0'],
    ['addresses', '0', 'city'],
  ],
};

function expectBadInput(fn, message) {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    expect(error.message).toMatch(message);
    expect(error.code).toBe('BAD_USER_INPUT');
  }
}

describe('jsonFilterValidation', () => {
  describe('validateJsonMatchInput', () => {
    test('accepts equals with omitted path', () => {
      expect(validateJsonMatchInput({ equals: {} }, ctx)).toEqual({
        path: [],
        operator: 'equals',
        value: {},
      });
    });

    test('accepts nested path from allowedPaths', () => {
      expect(
        validateJsonMatchInput(
          {
            path: ['profile', 'country'],
            equals: 'DE',
          },
          ctx
        )
      ).toEqual({
        path: ['profile', 'country'],
        operator: 'equals',
        value: 'DE',
      });
    });

    test('keeps falsy operator values', () => {
      expect(validateJsonMatchInput({ equals: false }, ctx)).toEqual({
        path: [],
        operator: 'equals',
        value: false,
      });

      expect(validateJsonMatchInput({ equals: 0 }, ctx)).toEqual({
        path: [],
        operator: 'equals',
        value: 0,
      });

      expect(validateJsonMatchInput({ equals: '' }, ctx)).toEqual({
        path: [],
        operator: 'equals',
        value: '',
      });

      expect(validateJsonMatchInput({ array_contains: null }, ctx)).toEqual({
        path: [],
        operator: 'array_contains',
        value: null,
      });
    });

    test('rejects null / non-object JsonMatchInput', () => {
      expect(validateJsonMatchInput(null, ctx)).toBe(null);
      expect(validateJsonMatchInput(undefined, ctx)).toBe(null);

      expectBadInput(() => validateJsonMatchInput([], ctx), /must be an object/);
      expectBadInput(() => validateJsonMatchInput('x', ctx), /must be an object/);
    });

    test('rejects zero operators', () => {
      expectBadInput(
        () => validateJsonMatchInput({ path: ['profile', 'country'] }, ctx),
        /One condition is required/
      );
    });

    test('rejects multiple operators', () => {
      expectBadInput(
        () => validateJsonMatchInput({ equals: 'DE', exists: true }, ctx),
        /Only one condition/
      );
    });

    test('rejects unknown operator', () => {
      expectBadInput(
        () => validateJsonMatchInput({ is_null: true }, ctx),
        /Unknown JSON match operator/
      );
    });
  });

  describe('normalizeJsonMatchInput', () => {
    test('normalizes positive operators', () => {
      expect(normalizeJsonMatchInput({ equals: 'DE' }, ctx)).toEqual({
        path: [],
        operator: 'equals',
        value: 'DE',
        negate: false,
      });
    });

    test('normalizes not to equals + negate', () => {
      expect(normalizeJsonMatchInput({ not: true }, ctx)).toEqual({
        path: [],
        operator: 'equals',
        value: true,
        negate: true,
      });
    });

    test('normalizes not_in to in + negate', () => {
      expect(normalizeJsonMatchInput({ not_in: [0, false] }, ctx)).toEqual({
        path: [],
        operator: 'in',
        value: [0, false],
        negate: true,
      });
    });

    test('normalizes exists:false to exists + negate', () => {
      expect(normalizeJsonMatchInput({ exists: false }, ctx)).toEqual({
        path: [],
        operator: 'exists',
        value: true,
        negate: true,
      });
    });

    test('normalizes string negative operators', () => {
      expect(normalizeJsonMatchInput({ string_not_contains: 'spam' }, ctx)).toEqual({
        path: [],
        operator: 'string_contains',
        value: 'spam',
        negate: true,
      });

      expect(normalizeJsonMatchInput({ string_not_starts_with: 'a' }, ctx)).toEqual({
        path: [],
        operator: 'string_starts_with',
        value: 'a',
        negate: true,
      });

      expect(normalizeJsonMatchInput({ string_not_ends_with: 'z' }, ctx)).toEqual({
        path: [],
        operator: 'string_ends_with',
        value: 'z',
        negate: true,
      });
    });

    test('normalizes array_not_contains', () => {
      expect(normalizeJsonMatchInput({ array_not_contains: null }, ctx)).toEqual({
        path: [],
        operator: 'array_contains',
        value: null,
        negate: true,
      });
    });
  });

  describe('getRootFieldNullMatch', () => {
    test('detects root equals:null', () => {
      const normalized = normalizeJsonMatchInput({ equals: null }, ctx);
      expect(getRootFieldNullMatch(normalized)).toBe(FIELD_NULL);
    });

    test('detects root not:null', () => {
      const normalized = normalizeJsonMatchInput({ not: null }, ctx);
      expect(getRootFieldNullMatch(normalized)).toBe(FIELD_NOT_NULL);
    });

    test('detects root exists:false', () => {
      const normalized = normalizeJsonMatchInput({ exists: false }, ctx);
      expect(getRootFieldNullMatch(normalized)).toBe(FIELD_NULL);
    });

    test('detects root exists:true', () => {
      const normalized = normalizeJsonMatchInput({ exists: true }, ctx);
      expect(getRootFieldNullMatch(normalized)).toBe(FIELD_NOT_NULL);
    });

    test('does not treat nested equals:null as field null', () => {
      const normalized = normalizeJsonMatchInput(
        {
          path: ['profile', 'middleName'],
          equals: null,
        },
        ctx
      );

      expect(getRootFieldNullMatch(normalized)).toBe(null);
    });
  });

  describe('path validation', () => {
    const invalidPathCases = [
      ['empty path', []],
      ['dot path', ['profile.country']],
      ['JSONPath segment', ['$.profile.country']],
      ['wildcard segment', ['profile', '*']],
      ['recursive descent', ['..secret']],
      ['Mongo operator', ['$ne']],
      ['Mongo where', ['$where']],
      ['SQL-looking segment', ['x; DROP TABLE User; --']],
      ['template-looking segment', ['${metadata}']],
      ['negative index', ['tags', '-1']],
      ['leading zero index', ['tags', '01']],
      ['float index', ['tags', '1.0']],
      ['scientific index', ['tags', '1e2']],
      ['too large index', ['tags', '10000']],
      ['zero-width joiner', ['pro\u200Dfile']],
      ['bidi override', ['profile\u202Ecountry']],
      ['cyrillic homoglyph', ['рrofile']],
      ['combining mark', ['profi\u0301le']],
      ['null byte', ['profile\u0000country']],
      ['newline', ['profile\ncountry']],
      ['forbidden __proto__', ['__proto__']],
      ['forbidden prototype', ['prototype']],
      ['forbidden constructor', ['constructor']],
      ['forbidden __typename', ['__typename']],
    ];

    test.each(invalidPathCases)('rejects %s', (_, path) => {
      expectBadInput(
        () => validateJsonMatchInput({ path, equals: 'x' }, { ...ctx, allowedPaths: undefined }),
        /Invalid JSON path segment|JSON path cannot be empty/
      );
    });

    test('rejects non-string path segment', () => {
      expectBadInput(
        () =>
          validateJsonMatchInput(
            {
              path: ['tags', 0],
              equals: 'x',
            },
            ctx
          ),
        /Segment must be a string/
      );
    });

    test('rejects path that is valid but not allowed', () => {
      expectBadInput(
        () =>
          validateJsonMatchInput(
            {
              path: ['profile', 'secretToken'],
              equals: 'x',
            },
            {
              ...ctx,
              allowedPaths: [['profile', 'country']],
            }
          ),
        /is not allowed/
      );
    });

    test('rejects path deeper than limit', () => {
      expectBadInput(
        () =>
          validateJsonMatchInput(
            {
              path: ['a', 'b', 'c'],
              equals: 'x',
            },
            {
              ...ctx,
              allowedPaths: undefined,
              limits: { maxPathDepth: 2 },
            }
          ),
        /path is too deep/
      );
    });

    test('rejects path segment longer than limit', () => {
      expectBadInput(
        () =>
          validateJsonMatchInput(
            {
              path: ['a'.repeat(11)],
              equals: 'x',
            },
            {
              ...ctx,
              allowedPaths: undefined,
              limits: { maxPathSegmentLength: 10 },
            }
          ),
        /Invalid JSON path segment/
      );
    });
  });

  describe('operator value validation', () => {
    test('rejects invalid number operators', () => {
      expectBadInput(
        () => validateJsonMatchInput({ number_gte: '0' }, ctx),
        /number_gte must be a finite number/
      );

      expectBadInput(
        () => validateJsonMatchInput({ number_gte: null }, ctx),
        /number_gte must be a finite number/
      );

      expectBadInput(
        () => validateJsonMatchInput({ number_gte: Infinity }, ctx),
        /number_gte must be a finite number/
      );

      expectBadInput(
        () => validateJsonMatchInput({ number_gte: NaN }, ctx),
        /number_gte must be a finite number/
      );
    });

    test('rejects invalid string operators', () => {
      expectBadInput(
        () => validateJsonMatchInput({ string_contains: 123 }, ctx),
        /string_contains must be a string/
      );

      expectBadInput(
        () =>
          validateJsonMatchInput(
            { string_contains: 'x'.repeat(20) },
            {
              ...ctx,
              limits: { maxStringLength: 10 },
            }
          ),
        /string_contains is too long/
      );
    });

    test('rejects invalid exists value', () => {
      expectBadInput(
        () => validateJsonMatchInput({ exists: null }, ctx),
        /exists must be a boolean/
      );

      expectBadInput(
        () => validateJsonMatchInput({ exists: 'false' }, ctx),
        /exists must be a boolean/
      );
    });

    test('rejects empty or non-array match lists', () => {
      validateJsonMatchInput({ in: [] }, ctx);
      validateJsonMatchInput({ not_in: [] }, ctx);

      expectBadInput(() => validateJsonMatchInput({ in: 'DE' }, ctx), /in must be an array/);
    });

    test('rejects null inside match lists by default', () => {
      expectBadInput(() => validateJsonMatchInput({ in: [null] }, ctx), /in cannot contain null/);

      expectBadInput(
        () => validateJsonMatchInput({ not_in: ['DE', null] }, ctx),
        /not_in cannot contain null/
      );
    });

    test('allows null inside match lists when explicitly enabled', () => {
      expect(
        validateJsonMatchInput({ in: [null, 'DE'] }, { ...ctx, allowNullInLists: true })
      ).toEqual({
        path: [],
        operator: 'in',
        value: [null, 'DE'],
      });
    });

    test('allows null inside not_in when explicitly enabled', () => {
      expect(
        validateJsonMatchInput({ not_in: [null, 'DE'] }, { ...ctx, allowNullInLists: true })
      ).toEqual({
        path: [],
        operator: 'not_in',
        value: [null, 'DE'],
      });

      expect(
        normalizeJsonMatchInput({ not_in: [null, 'DE'] }, { ...ctx, allowNullInLists: true })
      ).toEqual({
        path: [],
        operator: 'in',
        value: [null, 'DE'],
        negate: true,
      });
    });
  });

  describe('whole-field list validation', () => {
    test('allows null in whole-field lists by default', () => {
      expect(() =>
        validateJsonFieldListFilter([null, {}, [], false, 0, ''], 'metadata_in', ctx)
      ).not.toThrow();
    });

    test('can reject null in whole-field lists when configured', () => {
      expectBadInput(
        () =>
          validateJsonFieldListFilter([null], 'metadata_in', {
            ...ctx,
            allowNullInLists: false,
          }),
        /metadata_in cannot contain null/
      );
    });

    test('accepts empty whole-field lists', () => {
      validateJsonFieldListFilter([], 'metadata_in', ctx);
      validateJsonFieldListFilter([], 'metadata_not_in', ctx);
    });

    test('rejects very large whole-field lists', () => {
      expectBadInput(
        () =>
          validateJsonFieldListFilter(['x', 'y', 'z'], 'metadata_in', {
            ...ctx,
            limits: { maxListLength: 2 },
          }),
        /metadata_in has too many items/
      );
    });
  });

  describe('JSON value validation', () => {
    test('accepts ordinary JSON values', () => {
      expect(() => validateJsonFieldValue(null, ctx)).not.toThrow();
      expect(() => validateJsonFieldValue({}, ctx)).not.toThrow();
      expect(() => validateJsonFieldValue([], ctx)).not.toThrow();
      expect(() => validateJsonFieldValue('x', ctx)).not.toThrow();
      expect(() => validateJsonFieldValue(123, ctx)).not.toThrow();
      expect(() => validateJsonFieldValue(false, ctx)).not.toThrow();
      expect(() => validateJsonFieldValue({ a: [{ b: null }, false, 0, ''] }, ctx)).not.toThrow();
    });

    test('allows Mongo-looking object keys in literal JSON values', () => {
      expect(() =>
        validateJsonFieldValue(
          {
            $ne: null,
            'profile.country': 'DE',
          },
          ctx
        )
      ).not.toThrow();
    });

    test('can reject unsafe literal object keys when configured', () => {
      expectBadInput(
        () =>
          validateJsonFieldValue(
            { $ne: null },
            {
              ...ctx,
              allowUnsafeLiteralObjectKeys: false,
            }
          ),
        /Invalid JSON object key/
      );
    });

    test('rejects unsupported JS value types', () => {
      expectBadInput(() => validateJsonFieldValue(undefined, ctx), /Unsupported JSON value type/);
      expectBadInput(() => validateJsonFieldValue(() => {}, ctx), /Unsupported JSON value type/);
      expectBadInput(() => validateJsonFieldValue(Symbol('x'), ctx), /Unsupported JSON value type/);
    });

    test('rejects non-finite numbers', () => {
      expectBadInput(() => validateJsonFieldValue(Infinity, ctx), /must be finite/);
      expectBadInput(() => validateJsonFieldValue(NaN, ctx), /must be finite/);
    });

    test('rejects too deep JSON values', () => {
      expectBadInput(
        () =>
          validateJsonFieldValue(
            {
              a: {
                b: {
                  c: 'x',
                },
              },
            },
            {
              ...ctx,
              limits: { maxJsonDepth: 1 },
            }
          ),
        /JSON value is too deep/
      );
    });

    test('rejects too many object keys', () => {
      expectBadInput(
        () =>
          validateJsonFieldValue(
            {
              a: 1,
              b: 2,
              c: 3,
            },
            {
              ...ctx,
              limits: { maxObjectKeys: 2 },
            }
          ),
        /too many keys/
      );
    });

    test('rejects too long object keys', () => {
      expectBadInput(
        () =>
          validateJsonFieldValue(
            {
              veryLongKey: 1,
            },
            {
              ...ctx,
              limits: { maxObjectKeyLength: 4 },
            }
          ),
        /object key is too long/
      );
    });

    test('rejects circular objects', () => {
      const value = {};
      value.self = value;

      expectBadInput(() => validateJsonFieldValue(value, ctx), /Circular JSON object/);
    });

    test('rejects circular arrays', () => {
      const value = [];
      value.push(value);

      expectBadInput(() => validateJsonFieldValue(value, ctx), /Circular JSON array/);
    });
  });

  describe('array object pattern validation', () => {
    test('rejects Mongo operator keys in array_contains object pattern', () => {
      expectBadInput(
        () => validateJsonMatchInput({ array_contains: { $ne: 'x' } }, ctx),
        /Invalid JSON object key/
      );
    });

    test('rejects nested Mongo operator keys in array_contains object pattern', () => {
      expectBadInput(
        () =>
          validateJsonMatchInput(
            {
              array_contains: {
                code: {
                  $gt: 'a',
                },
              },
            },
            ctx
          ),
        /Invalid JSON object key/
      );
    });

    test('rejects dotted keys in array_contains object pattern', () => {
      expectBadInput(
        () => validateJsonMatchInput({ array_contains: { 'code.root': 'x' } }, ctx),
        /Invalid JSON object key/
      );
    });

    test('rejects prototype pollution keys in array_contains object pattern', () => {
      expectBadInput(
        () => validateJsonMatchInput({ array_contains: { ['__proto__']: 'x' } }, ctx),
        /Invalid JSON object key/
      );

      expectBadInput(
        () => validateJsonMatchInput({ array_contains: { constructor: 'x' } }, ctx),
        /Invalid JSON object key/
      );

      expectBadInput(
        () => validateJsonMatchInput({ array_contains: { prototype: 'x' } }, ctx),
        /Invalid JSON object key/
      );
    });

    test('rejects object pattern that is too deep', () => {
      expectBadInput(
        () =>
          validateJsonMatchInput(
            {
              array_contains: {
                a: { b: { c: { d: { e: { f: { g: { h: { i: 'x' } } } } } } } },
              },
            },
            ctx
          ),
        /JSON object pattern is too deep/
      );
    });

    test('can disable object pattern validation', () => {
      expect(() =>
        validateJsonMatchInput(
          {
            array_contains: {
              $ne: 'x',
            },
          },
          {
            ...ctx,
            validateArrayObjectPattern: false,
          }
        )
      ).not.toThrow();
    });
  });

  describe('validateJsonWhereInput', () => {
    const whereCtx = {
      listKey: 'User',
      jsonFields: {
        metadata: {
          allowedPaths: ctx.allowedPaths,
          allowNullInFieldLists: true,
          allowNullInMatchLists: false,
        },
      },
    };

    test.skip('accepts empty AND / OR', () => {
      validateJsonWhereInput(
        {
          AND: [],
        },
        whereCtx
      );

      validateJsonWhereInput(
        {
          OR: [],
        },
        whereCtx
      );
    });

    test('rejects too deep where input', () => {
      expectBadInput(
        () =>
          validateJsonWhereInput(
            {
              AND: [
                {
                  AND: [
                    {
                      AND: [{ metadata_match: { equals: {} } }],
                    },
                  ],
                },
              ],
            },
            {
              ...whereCtx,
              limits: { maxWhereDepth: 1 },
            }
          ),
        /WhereInput is too deep/
      );
    });

    test('rejects too many logical items', () => {
      expectBadInput(
        () =>
          validateJsonWhereInput(
            {
              OR: [
                { metadata_match: { equals: 1 } },
                { metadata_match: { equals: 2 } },
                { metadata_match: { equals: 3 } },
              ],
            },
            {
              ...whereCtx,
              limits: { maxLogicalItems: 2 },
            }
          ),
        /OR has too many items/
      );
    });

    test('rejects invalid nested json match in where input', () => {
      expectBadInput(
        () =>
          validateJsonWhereInput(
            {
              metadata_match: {
                path: ['profile.country'],
                equals: 'DE',
              },
            },
            whereCtx
          ),
        /Invalid JSON path segment/
      );
    });

    test('rejects null inside JsonMatchInput list when field config disallows it', () => {
      expectBadInput(
        () =>
          validateJsonWhereInput(
            {
              metadata_match: {
                in: [null],
              },
            },
            whereCtx
          ),
        /in cannot contain null/
      );
    });

    test('allows null inside whole-field metadata_in when field config allows it', () => {
      expect(() =>
        validateJsonWhereInput(
          {
            metadata_in: [null],
          },
          whereCtx
        )
      ).not.toThrow();
    });

    test('allows null inside whole-field metadata_not_in when field config allows it', () => {
      expect(() =>
        validateJsonWhereInput(
          {
            metadata_not_in: [null],
          },
          whereCtx
        )
      ).not.toThrow();
    });

    test('rejects null inside whole-field metadata_in when field config disallows it', () => {
      expectBadInput(
        () =>
          validateJsonWhereInput(
            {
              metadata_in: [null],
            },
            {
              ...whereCtx,
              jsonFields: {
                metadata: {
                  ...whereCtx.jsonFields.metadata,
                  allowNullInFieldLists: false,
                },
              },
            }
          ),
        /metadata_in cannot contain null/
      );
    });

    test('rejects null inside metadata_match not_in when field config disallows it', () => {
      expectBadInput(
        () =>
          validateJsonWhereInput(
            {
              metadata_match: {
                not_in: ['DE', null],
              },
            },
            whereCtx
          ),
        /not_in cannot contain null/
      );
    });

    test('rejects invalid JsonMatchInput inside nested OR branch', () => {
      expectBadInput(
        () =>
          validateJsonWhereInput(
            {
              AND: [
                { metadata_match: { equals: {} } },
                {
                  OR: [
                    { metadata_match: { equals: [] } },
                    { metadata_match: { path: ['profile.country'], equals: 'DE' } },
                  ],
                },
              ],
            },
            whereCtx
          ),
        /Invalid JSON path segment/
      );
    });

    test('accepts valid where input', () => {
      expect(() =>
        validateJsonWhereInput(
          {
            AND: [
              { metadata_match: { path: ['profile', 'country'], equals: 'DE' } },
              {
                OR: [{ metadata_match: { number_gte: 0 } }, { metadata_in: [null, {}, []] }],
              },
            ],
          },
          whereCtx
        )
      ).not.toThrow();
    });

    test('rejects global NOT', () => {
      expectBadInput(
        () =>
          validateJsonWhereInput(
            {
              NOT: [{ metadata_match: { equals: {} } }],
            },
            whereCtx
          ),
        /NOT is not supported/
      );
    });
  });

  test('rejects too large JsonMatchInput in-list', () => {
    expectBadInput(
      () =>
        validateJsonMatchInput(
          { in: ['a', 'b', 'c'] },
          {
            ...ctx,
            limits: { maxListLength: 2 },
          }
        ),
      /in has too many items/
    );
  });

  test('rejects too large array inside equals', () => {
    expectBadInput(
      () =>
        validateJsonMatchInput(
          { equals: ['a', 'b', 'c'] },
          {
            ...ctx,
            limits: { maxListLength: 2 },
          }
        ),
      /JSON array value has too many items/
    );
  });

  test('rejects too many object keys inside equals', () => {
    expectBadInput(
      () =>
        validateJsonMatchInput(
          { equals: { a: 1, b: 2, c: 3 } },
          {
            ...ctx,
            limits: { maxObjectKeys: 2 },
          }
        ),
      /too many keys/
    );
  });

  test('rejects too large JsonMatchInput not_in-list', () => {
    expectBadInput(
      () =>
        validateJsonMatchInput(
          { not_in: ['a', 'b', 'c'] },
          {
            ...ctx,
            limits: { maxListLength: 2 },
          }
        ),
      /not_in has too many items/
    );
  });

  test('rejects too long literal JSON string value', () => {
    expectBadInput(
      () =>
        validateJsonMatchInput(
          { equals: 'x'.repeat(20) },
          {
            ...ctx,
            limits: { maxStringLength: 10 },
          }
        ),
      /JSON string value is too long/
    );
  });
});

const allowedPaths = [
  ['profile', 'country'],
  ['profile', 'age'],
  ['profile', 'email'],
  ['profile', 'middleName'],
  ['tags'],
  ['tags', '0'],
  ['tags', '1'],
  ['tags', '9999'],
  ['addresses', '0', 'city'],
];

const makeFieldCtx = config => ({
  listKey: 'User',
  fieldPath: 'metadata',
  allowedPaths,
  ...config,
});

const normalize = (value, config) => normalizeJsonMatchInput(value, makeFieldCtx(config));

const expectInvalid = (value, message, config) => {
  expect(() => normalize(value, config)).toThrow(message);
};

describe('normalizeJsonMatchInput', () => {
  describe('valid positive operators', () => {
    test.each([
      [
        'equals null',
        { equals: null },
        { path: [], operator: 'equals', value: null, negate: false },
      ],
      [
        'equals false',
        { equals: false },
        { path: [], operator: 'equals', value: false, negate: false },
      ],
      [
        'equals false',
        { equals: true },
        { path: [], operator: 'equals', value: true, negate: false },
      ],
      ['equals 0', { equals: 0 }, { path: [], operator: 'equals', value: 0, negate: false }],
      [
        'equals empty string',
        { equals: '' },
        { path: [], operator: 'equals', value: '', negate: false },
      ],
      [
        'equals empty object',
        { equals: {} },
        { path: [], operator: 'equals', value: {}, negate: false },
      ],
      [
        'equals empty array',
        { equals: [] },
        { path: [], operator: 'equals', value: [], negate: false },
      ],
      [
        'exists true',
        { exists: true },
        { path: [], operator: 'exists', value: true, negate: false },
      ],
      [
        'in with scalars',
        { in: ['DE', 0, false] },
        { path: [], operator: 'in', value: ['DE', 0, false], negate: false },
      ],
      ['number_lt', { number_lt: 1 }, { path: [], operator: 'number_lt', value: 1, negate: false }],
      [
        'number_lte zero',
        { number_lte: 0 },
        { path: [], operator: 'number_lte', value: 0, negate: false },
      ],
      [
        'number_gt negative',
        { number_gt: -1 },
        { path: [], operator: 'number_gt', value: -1, negate: false },
      ],
      [
        'number_gte zero',
        { number_gte: 0 },
        { path: [], operator: 'number_gte', value: 0, negate: false },
      ],
      [
        'string_contains empty',
        { string_contains: '' },
        { path: [], operator: 'string_contains', value: '', negate: false },
      ],
      [
        'string_starts_with',
        { string_starts_with: 'root' },
        { path: [], operator: 'string_starts_with', value: 'root', negate: false },
      ],
      [
        'string_ends_with',
        { string_ends_with: 'text' },
        { path: [], operator: 'string_ends_with', value: 'text', negate: false },
      ],
      [
        'array_contains null',
        { array_contains: null },
        { path: [], operator: 'array_contains', value: null, negate: false },
      ],
      [
        'array_contains object',
        { array_contains: { code: 'x' } },
        { path: [], operator: 'array_contains', value: { code: 'x' }, negate: false },
      ],
    ])('%s', (_title, input, expected) => {
      expect(normalize(input)).toEqual(expected);
    });

    test('keeps allowed path', () => {
      expect(normalize({ path: ['profile', 'country'], equals: 'DE' })).toEqual({
        path: ['profile', 'country'],
        operator: 'equals',
        value: 'DE',
        negate: false,
      });
    });

    test('keeps allowed array index path', () => {
      expect(normalize({ path: ['addresses', '0', 'city'], equals: 'Berlin' })).toEqual({
        path: ['addresses', '0', 'city'],
        operator: 'equals',
        value: 'Berlin',
        negate: false,
      });
    });

    test('allows valid path when allowedPaths is not configured', () => {
      expect(
        normalize(
          { path: ['anySafeKey', '0', 'nested_key'], equals: 'x' },
          { allowedPaths: undefined }
        )
      ).toEqual({
        path: ['anySafeKey', '0', 'nested_key'],
        operator: 'equals',
        value: 'x',
        negate: false,
      });
    });

    test('allows exact allowlisted array index path', () => {
      expect(
        validateJsonMatchInput(
          {
            path: ['addresses', '0', 'city'],
            equals: 'Berlin',
          },
          ctx
        )
      ).toEqual({
        path: ['addresses', '0', 'city'],
        operator: 'equals',
        value: 'Berlin',
      });
    });

    test('allows max valid array index when allowlisted', () => {
      expect(normalize({ path: ['tags', '9999'], exists: true })).toEqual({
        path: ['tags', '9999'],
        operator: 'exists',
        value: true,
        negate: false,
      });
    });
  });

  describe('valid negative operator normalization', () => {
    test.each([
      ['not null', { not: null }, { path: [], operator: 'equals', value: null, negate: true }],
      ['not true', { not: true }, { path: [], operator: 'equals', value: true, negate: true }],
      ['not false', { not: false }, { path: [], operator: 'equals', value: false, negate: true }],
      ['not 0', { not: 0 }, { path: [], operator: 'equals', value: 0, negate: true }],
      ['not empty string', { not: '' }, { path: [], operator: 'equals', value: '', negate: true }],
      ['not empty object', { not: {} }, { path: [], operator: 'equals', value: {}, negate: true }],
      ['not empty array', { not: [] }, { path: [], operator: 'equals', value: [], negate: true }],
      [
        'not_in',
        { not_in: ['DE', false] },
        { path: [], operator: 'in', value: ['DE', false], negate: true },
      ],
      [
        'exists false',
        { exists: false },
        { path: [], operator: 'exists', value: true, negate: true },
      ],
      [
        'string_not_contains',
        { string_not_contains: 'spam' },
        { path: [], operator: 'string_contains', value: 'spam', negate: true },
      ],
      [
        'string_not_starts_with',
        { string_not_starts_with: 'admin' },
        { path: [], operator: 'string_starts_with', value: 'admin', negate: true },
      ],
      [
        'string_not_ends_with',
        { string_not_ends_with: '.ru' },
        { path: [], operator: 'string_ends_with', value: '.ru', negate: true },
      ],
      [
        'array_not_contains',
        { array_not_contains: 'beta' },
        { path: [], operator: 'array_contains', value: 'beta', negate: true },
      ],
      [
        'array_not_contains null',
        { array_not_contains: null },
        { path: [], operator: 'array_contains', value: null, negate: true },
      ],
    ])('%s', (_title, input, expected) => {
      expect(normalize(input)).toEqual(expected);
    });

    test('normalizes negative operator with path', () => {
      expect(normalize({ path: ['profile', 'country'], not: 'DE' })).toEqual({
        path: ['profile', 'country'],
        operator: 'equals',
        value: 'DE',
        negate: true,
      });
    });
  });

  describe('path validation', () => {
    test('rejects path:null', () => {
      expectInvalid({ path: null, equals: 'x' }, /JSON path must be an array of strings/);
    });

    test('rejects path as string', () => {
      expectInvalid(
        { path: 'profile.country', equals: 'x' },
        /JSON path must be an array of strings/
      );
    });

    test('rejects empty path', () => {
      expectInvalid({ path: [], equals: 'x' }, /JSON path cannot be empty/);
    });

    test('rejects non-string path segment', () => {
      expectInvalid({ path: ['tags', 0], equals: 'x' }, /Segment must be a string/);
    });

    test.each([
      ['dot segment', ['profile.country']],
      ['JSONPath segment', ['$.profile.country']],
      ['array syntax segment', ['items[0]']],
      ['wildcard segment', ['profile', '*']],
      ['recursive descent', ['..secret']],
      ['Mongo operator', ['$ne']],
      ['Mongo where', ['$where']],
      ['SQL-looking segment', ['x; DROP TABLE User; --']],
      ['template-looking segment', ['${metadata}']],
      ['negative index', ['tags', '-1']],
      ['leading zero index', ['tags', '01']],
      ['float index', ['tags', '1.0']],
      ['scientific index', ['tags', '1e2']],
      ['too large index', ['tags', '10000']],
      ['forbidden __proto__', ['__proto__']],
      ['forbidden prototype', ['prototype']],
      ['forbidden constructor', ['constructor']],
      ['forbidden __typename', ['__typename']],
      ['zero-width joiner', ['pro\u200Dfile']],
      ['bidi override', ['profile\u202Ecountry']],
      ['cyrillic homoglyph', ['рrofile']], // first char is Cyrillic U+0440
      ['combining mark', ['profi\u0301le']],
      ['null byte', ['profile\u0000country']],
      ['newline', ['profile\ncountry']],
      ['fullwidth underscore', ['＿profile']],
    ])('rejects %s', (_title, path) => {
      expectInvalid({ path, equals: 'x' }, /Invalid JSON path segment/, {
        allowedPaths: undefined,
      });
    });

    test('rejects syntactically valid but not allowlisted path', () => {
      expectInvalid({ path: ['profile', 'secretToken'], equals: 'x' }, /is not allowed/, {
        allowedPaths: [['profile', 'country']],
      });
    });

    test('requires exact allowedPaths match, not prefix match', () => {
      expectInvalid({ path: ['profile'], equals: 'x' }, /is not allowed/, {
        allowedPaths: [['profile', 'country']],
      });
    });
  });

  describe('operator count validation', () => {
    test('rejects input with no operator', () => {
      expectInvalid({ path: ['profile', 'country'] }, /One condition is required/);
    });

    test('rejects empty object', () => {
      expectInvalid({}, /One condition is required/);
    });

    test('rejects multiple operators', () => {
      expectInvalid({ equals: 'DE', exists: true }, /Only one condition can be used/);
    });

    test('ignores undefined operator values when counting conditions', () => {
      expect(normalize({ equals: undefined, exists: true })).toEqual({
        path: [],
        operator: 'exists',
        value: true,
        negate: false,
      });
    });

    test('rejects only undefined operator values', () => {
      expectInvalid({ equals: undefined }, /One condition is required/);
    });
  });

  describe('operator value validation', () => {
    test.each([
      ['in string', { in: 'DE' }, /in must be an array/],
      ['not_in string', { not_in: 'DE' }, /not_in must be an array/],
    ])('rejects invalid list operator: %s', (_title, input, error) => {
      expectInvalid(input, error);
    });

    test.each([
      ['string_contains number', { string_contains: 1 }, /string_contains must be a string/],
      ['string_contains null', { string_contains: null }, /string_contains must be a string/],
      [
        'string_not_contains object',
        { string_not_contains: {} },
        /string_not_contains must be a string/,
      ],
      [
        'string_starts_with false',
        { string_starts_with: false },
        /string_starts_with must be a string/,
      ],
      [
        'string_not_starts_with array',
        { string_not_starts_with: [] },
        /string_not_starts_with must be a string/,
      ],
      ['string_ends_with number', { string_ends_with: 1 }, /string_ends_with must be a string/],
      [
        'string_not_ends_with null',
        { string_not_ends_with: null },
        /string_not_ends_with must be a string/,
      ],
    ])('rejects invalid string operator: %s', (_title, input, error) => {
      expectInvalid(input, error);
    });

    test.each([
      ['number_lt string', { number_lt: '1' }, /number_lt must be a finite number/],
      ['number_lte null', { number_lte: null }, /number_lte must be a finite number/],
      ['number_gt false', { number_gt: false }, /number_gt must be a finite number/],
      ['number_gte object', { number_gte: {} }, /number_gte must be a finite number/],
    ])('rejects invalid number operator: %s', (_title, input, error) => {
      expectInvalid(input, error);
    });

    test.each([
      ['exists null', { exists: null }],
      ['exists string', { exists: 'false' }],
      ['exists 0', { exists: 0 }],
      ['exists 1', { exists: 1 }],
    ])('rejects invalid exists operator: %s', (_title, input) => {
      expectInvalid(input, /exists must be a boolean/);
    });
  });

  describe('security edge cases', () => {
    test('treats SQL-looking string value as a normal value', () => {
      expect(normalize({ string_contains: "' OR '1'='1" })).toEqual({
        path: [],
        operator: 'string_contains',
        value: "' OR '1'='1",
        negate: false,
      });
    });

    test('treats Mongo-looking object in equals as a normal JSON value', () => {
      expect(normalize({ equals: { $ne: null } })).toEqual({
        path: [],
        operator: 'equals',
        value: { $ne: null },
        negate: false,
      });
    });

    test('treats Mongo-looking object inside in-list as a normal JSON value', () => {
      expect(normalize({ in: [{ $ne: null }] })).toEqual({
        path: [],
        operator: 'in',
        value: [{ $ne: null }],
        negate: false,
      });
    });

    test('rejects Mongo operator keys in array_not_contains object pattern', () => {
      expectBadInput(
        () => validateJsonMatchInput({ array_not_contains: { $ne: 'x' } }, ctx),
        /Invalid JSON object key/
      );
    });

    test('rejects nested Mongo operator keys in array_not_contains object pattern', () => {
      expectBadInput(
        () =>
          validateJsonMatchInput(
            {
              array_not_contains: {
                code: {
                  $gt: 'a',
                },
              },
            },
            ctx
          ),
        /Invalid JSON object key/
      );
    });

    test('rejects dotted keys in array_not_contains object pattern', () => {
      expectBadInput(
        () => validateJsonMatchInput({ array_not_contains: { 'code.root': 'x' } }, ctx),
        /Invalid JSON object key/
      );
    });

    test('can disable object pattern validation for array_not_contains', () => {
      expect(() =>
        validateJsonMatchInput(
          {
            array_not_contains: {
              $ne: 'x',
            },
          },
          {
            ...ctx,
            validateArrayObjectPattern: false,
          }
        )
      ).not.toThrow();
    });

    test('accepts null-prototype object as JSON object value', () => {
      const value = Object.create(null);
      value.code = 'x';

      expect(() => validateJsonFieldValue(value, ctx)).not.toThrow();
    });

    test('accepts null-prototype object inside equals', () => {
      const value = Object.create(null);
      value.code = 'x';

      expect(validateJsonMatchInput({ equals: value }, ctx)).toEqual({
        path: [],
        operator: 'equals',
        value,
      });
    });

    test.each([
      ['Date', new Date()],
      ['RegExp', /x/],
      ['Map', new Map()],
      ['Set', new Set()],
      ['class instance', new (class X {})()],
    ])('rejects non-JSON object value: %s', (_title, value) => {
      expectBadInput(() => validateJsonFieldValue(value, ctx), /Unsupported JSON value type/);
    });
  });

  describe('recommended hardening tests', () => {
    // These tests describe safer behavior. They will fail until normalizeJsonMatchInput
    // has an explicit operator allow-list and finite-number checks.

    test('rejects unknown operator', () => {
      expectInvalid({ unknown_operator: true }, /Unknown JSON match operator/);
    });

    test('rejects NaN number operators', () => {
      expectInvalid({ number_gte: NaN }, /number_gte must be a finite number/);
    });

    test('rejects Infinity number operators', () => {
      expectInvalid({ number_gte: Infinity }, /number_gte must be a finite number/);
    });
  });

  test('rejects circular object inside equals', () => {
    const value = {};
    value.self = value;

    expectBadInput(() => validateJsonMatchInput({ equals: value }, ctx), /Circular JSON object/);
  });

  test('rejects circular object inside in-list', () => {
    const value = {};
    value.self = value;

    expectBadInput(() => validateJsonMatchInput({ in: [value] }, ctx), /Circular JSON object/);
  });

  test('rejects circular object inside array_contains', () => {
    const value = {};
    value.self = value;

    expectBadInput(
      () => validateJsonMatchInput({ array_contains: value }, ctx),
      /Circular JSON object/
    );
  });
});
