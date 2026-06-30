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
});
