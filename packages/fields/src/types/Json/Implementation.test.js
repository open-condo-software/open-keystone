import { Json } from './Implementation';

const mocks = {
  getListByKey: jest.fn(),
  listKey: 'Test',
  listAdapter: {
    newFieldAdapter: jest.fn(() => ({})),
  },
  defaultAccess: true,
  schemaNames: ['public'],
};

describe('Json implementation', () => {
  test('gqlOutputFields', () => {
    const impl = new Json('path', {}, mocks);
    expect(impl.gqlOutputFields()).toEqual(['path: JSON']);
  });

  test('gqlOutputFieldResolvers', () => {
    const impl = new Json('path', {}, mocks);
    const resolvers = impl.gqlOutputFieldResolvers();
    expect(resolvers['path']({ path: { a: 1 } })).toEqual({ a: 1 });
  });

  test('gqlUpdateInputFields', () => {
    const impl = new Json('path', {}, mocks);
    expect(impl.gqlUpdateInputFields()).toEqual(['path: JSON']);
  });

  test('gqlCreateInputFields', () => {
    const impl = new Json('path', {}, mocks);
    expect(impl.gqlCreateInputFields()).toEqual(['path: JSON']);
  });

  test('extendAdminMeta', () => {
    const impl = new Json('path', { isMultiline: true, graphQLAdminFragment: '{ a }' }, mocks);
    const meta = { label: 'Path' };
    expect(impl.extendAdminMeta(meta)).toEqual({
      label: 'Path',
      isMultiline: true,
      graphQLAdminFragment: '{ a }',
    });
  });

  describe('enableMatchFilter', () => {
    test('false (default)', () => {
      const impl = new Json('path', {}, mocks);
      expect(impl.gqlQueryInputFields()).not.toContain('path_match: JsonMatchInput');
      expect(impl.getGqlAuxTypes()).toEqual(
        expect.arrayContaining([expect.stringContaining('input JsonMatchInput')])
      );
    });

    test('true', () => {
      const impl = new Json('path', { enableMatchFilter: true }, mocks);
      expect(impl.gqlQueryInputFields()).toContain('path_match: JsonMatchInput');
      expect(impl.getGqlAuxTypes()).toEqual(
        expect.arrayContaining([expect.stringContaining('input JsonMatchInput')])
      );
    });
  });

  describe('resolveInput', () => {
    test('no normalization', async () => {
      const impl = new Json('path', {}, mocks);
      expect(await impl.resolveInput({ resolvedData: { path: { a: 1 } } })).toEqual({ a: 1 });
      expect(await impl.resolveInput({ resolvedData: { path: [] } })).toEqual([]);
      expect(await impl.resolveInput({ resolvedData: { path: {} } })).toEqual({});
      expect(await impl.resolveInput({ resolvedData: { path: null } })).toEqual(null);
    });

    test('not in resolvedData', async () => {
      const impl = new Json('path', {}, mocks);
      expect(await impl.resolveInput({ resolvedData: {} })).toEqual(undefined);
    });

    test('strictWriteValidation', async () => {
      const impl = new Json('path', { strictWriteValidation: true }, mocks);
      await expect(impl.resolveInput({ resolvedData: { path: { a: 1 } } })).resolves.toEqual({
        a: 1,
      });
      await expect(
        impl.resolveInput({ resolvedData: { path: { constructor: 1 } } })
      ).rejects.toThrow('Invalid JSON object key "constructor"');
    });
  });

  describe('validateMatchCondition', () => {
    test('valid conditions', () => {
      const impl = new Json('path', {}, mocks);
      expect(() => impl.validateMatchCondition({ equals: 1 })).not.toThrow();
      expect(() => impl.validateMatchCondition({ path: ['a'], equals: 1 })).not.toThrow();
      expect(() => impl.validateMatchCondition({ equals: null })).not.toThrow();
      expect(() => impl.validateMatchCondition({ equals: [] })).not.toThrow();
      expect(() => impl.validateMatchCondition({ equals: {} })).not.toThrow();
    });

    test('invalid conditions', () => {
      const impl = new Json('path', {}, mocks);
      expect(() => impl.validateMatchCondition({})).toThrow('One condition is required');
      expect(() => impl.validateMatchCondition({ equals: 1, not: 2 })).toThrow(
        'Only one condition can be used'
      );
      expect(() => impl.validateMatchCondition({ path: [] })).toThrow('JSON path cannot be empty');
      expect(() => impl.validateMatchCondition({ path: [1] })).toThrow('Segment must be a string');
      expect(() => impl.validateMatchCondition({ path: ['__proto__'] })).toThrow(
        'Invalid JSON path segment'
      );
    });

    test('allowedMatchFilterPaths', () => {
      const impl = new Json('path', { allowedMatchFilterPaths: [['a']] }, mocks);
      expect(() => impl.validateMatchCondition({ path: ['a'], equals: 1 })).not.toThrow();
      expect(() => impl.validateMatchCondition({ path: ['b'], equals: 1 })).toThrow(
        'is not allowed'
      );
    });
  });
});
