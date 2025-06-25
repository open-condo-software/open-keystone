const path = require('path');
const next = require('next');
const nextBuild = require('next/dist/build').default;

class NextApp {
  constructor({ dir } = {}) {
    if (!dir || typeof dir !== 'string') {
      throw new Error('NextApp requires a "dir" option, which must be a string.');
    }
    this._dir = path.resolve(dir);
  }

  async prepareMiddleware({ dev }) {
    // NOTE: distDir is pointing to /dist, however next is built to /.next by default
    // We want to keep this behaviour, so I omitted it for now
    const nextApp = next({ dir: this._dir, dev });
    await nextApp.prepare();
    return nextApp.getRequestHandler();
  }

  async build() {
    return nextBuild(this._dir);
  }
}

module.exports = {
  NextApp,
};
