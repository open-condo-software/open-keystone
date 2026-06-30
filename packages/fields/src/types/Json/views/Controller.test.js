import JsonController from './Controller';

const config = {
  path: 'testField',
  label: 'Test Field',
  type: 'Json',
};

describe('JsonController', () => {
  test('serialize() - should clean __typename and parse JSON', () => {
    const controller = new JsonController(config, 'adminMeta');
    const data = {
      testField: JSON.stringify({
        a: 1,
        __typename: 'SomeType',
        nested: { b: 2, __typename: 'NestedType' },
      }),
    };
    const result = controller.serialize(data);
    expect(result).toEqual({
      a: 1,
      nested: { b: 2 },
    });
  });

  test('serialize() - should handle arrays', () => {
      const controller = new JsonController(config, 'adminMeta');
      const data = {
          testField: JSON.stringify([{ a: 1, __typename: 'A' }, { b: 2 }]),
      };
      const result = controller.serialize(data);
      expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  test('deserialize() - should clean __typename and stringify JSON', () => {
    const controller = new JsonController(config, 'adminMeta');
    const data = {
      testField: {
        a: 1,
        __typename: 'SomeType',
        nested: { b: 2, __typename: 'NestedType' },
      },
    };
    const result = controller.deserialize(data);
    expect(JSON.parse(result)).toEqual({
      a: 1,
      nested: { b: 2 },
    });
  });

  test('deserialize() - should return null for empty data', () => {
    const controller = new JsonController(config, 'adminMeta');
    expect(controller.deserialize({})).toBeNull();
    expect(controller.deserialize({ testField: null })).toBeNull();
  });

  test('getQueryFragment() - should include admin fragment', () => {
      const controller = new JsonController({ ...config, graphQLAdminFragment: '{ a b }' }, 'adminMeta');
      expect(controller.getQueryFragment().trim()).toBe('testField { a b }');
  });
});
