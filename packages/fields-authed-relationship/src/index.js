import { Relationship } from '@open-keystone/fields';
import { AuthedRelationship as implementation } from './Implementation';

export const AuthedRelationship = {
  ...Relationship,
  type: 'AuthedRelationship',
  implementation,
};
