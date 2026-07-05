const { getType, flatten } = require('@open-keystone/utils');

const {
  simpleTokenizer,
  relationshipTokenizer,
  modifierTokenizer,
  getRelatedListAdapterFromQueryPath,
} = require('./tokenizers');

// If it's 0 or 1 items, we can use it as-is. Any more needs an $and/$or
const joinTerms = (matchTerms, joinOp) => {
  if (matchTerms.length === 0) {
    return joinOp === '$or' ? { _id: { $exists: false } } : {};
  }
  return matchTerms.length > 1 ? { [joinOp]: matchTerms } : matchTerms[0];
};

const flattenQueries = (parsedQueries, joinOp) => ({
  matchTerm: joinTerms(
    parsedQueries.map(q => q.matchTerm).filter(matchTerm => matchTerm),
    joinOp
  ),
  postJoinPipeline: flatten(parsedQueries.map(q => q.postJoinPipeline || [])).filter(pipe => pipe),
  relationships: flatten(parsedQueries.map(q => q.relationships || [])),
});

function queryParser({ listAdapter, getUID }, query, pathSoFar = [], include) {
  if (getType(query) !== 'Object') {
    throw new Error(
      `Expected an Object for query, got ${getType(query)} at path ${pathSoFar.join('.')}`
    );
  }
  const excludeFields = listAdapter.fieldAdapters
    .filter(({ isRelationship, field }) => isRelationship && field.config.many)
    .map(({ dbPath }) => dbPath);
  const parsedQueries = Object.entries(query).map(([key, value]) => {
    const path = [...pathSoFar, key];
    if (['AND', 'OR'].includes(key)) {
      return flattenQueries(
        value.map((_query, index) =>
          queryParser({ listAdapter, getUID }, _query, [...path, index])
        ),
        { AND: '$and', OR: '$or' }[key]
      );
    } else if (['$search', '$sortBy', '$orderBy', '$skip', '$first', '$count'].includes(key)) {
      return { postJoinPipeline: [modifierTokenizer(listAdapter, query, key, path)] };
    } else if (key === 'id') {
      if (getType(value) === 'Object') {
        return { matchTerm: { _id: value } };
      } else {
        return { matchTerm: simpleTokenizer(listAdapter, query, key, path) };
      }
    } else if (getType(value) === 'Object') {
      // A relationship query component
      let currentListAdapter;
      try {
        currentListAdapter = getRelatedListAdapterFromQueryPath(listAdapter, path);
      } catch (e) {
        // If we can't find the list adapter, it's definitely not a relationship
        return { matchTerm: simpleTokenizer(listAdapter, query, key, path, null) };
      }

      const fieldAdapter = currentListAdapter.fieldAdapters.find(
        ({ path, isRelationship }) =>
          isRelationship && [path, `${path}_every`, `${path}_some`, `${path}_none`].includes(key)
      );

      if (fieldAdapter) {
        const { matchTerm, relationshipInfo } = relationshipTokenizer(
          listAdapter,
          key,
          path,
          getUID,
          currentListAdapter
        );

        return {
          // matchTerm is our filtering expression. This determines if the
          // parent item is included in the final list
          matchTerm,
          relationships: [
            { relationshipInfo, ...queryParser({ listAdapter, getUID }, value, path) },
          ],
        };
      } else {
        return { matchTerm: simpleTokenizer(listAdapter, query, key, path, currentListAdapter) };
      }
    } else {
      // A simple field query component
      return { matchTerm: simpleTokenizer(listAdapter, query, key, path) };
    }
  });
  const flatQueries = flattenQueries(parsedQueries, '$and');
  const includeFields = flatQueries.relationships.map(({ field }) => field);
  if (include) includeFields.push(include);

  return {
    ...flatQueries,
    excludeFields: excludeFields.filter(field => !includeFields.includes(field)),
  };
}

module.exports = { queryParser };
