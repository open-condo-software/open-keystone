const falsey = require('@open-keystone/utils').falsey;
const pino = require('pino');

module.exports = {
  graphqlLogger: pino({ name: 'graphql', enabled: falsey(process.env.DISABLE_LOGGING) }),
};
