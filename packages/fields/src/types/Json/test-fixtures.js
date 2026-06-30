import Json from './';
import { Text } from '@open-keystone/fields';

export const name = 'Json';
export const type = Json;
export const exampleValue = () => ({ a: 1 });
export const exampleValue2 = () => ({ b: 2 });
export const supportsUnique = false;
export const fieldName = 'testField';

export const getTestFields = () => ({
  name: { type: Text },
  testField: { type },
});

export const initItems = () => {
  return [
    { name: 'a', testField: { a: 1 } },
    { name: 'b', testField: { b: 2 } },
    { name: 'c', testField: { c: 3 } },
    { name: 'd', testField: [1, 2, 3] },
    { name: 'e', testField: { nested: { a: 1 } } },
    { name: 'f', testField: null },
    { name: 'g' },
  ];
};

export const storedValues = () => [
  { name: 'a', testField: { a: 1 } },
  { name: 'b', testField: { b: 2 } },
  { name: 'c', testField: { c: 3 } },
  { name: 'd', testField: [1, 2, 3] },
  { name: 'e', testField: { nested: { a: 1 } } },
  { name: 'f', testField: null },
  { name: 'g', testField: null },
];

export const supportedFilters = () => [
  'null_equality',
  'equality',
  'in_value',
];
