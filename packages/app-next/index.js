const path = require('path');
const next = require('next');
const nextBuild = require('next/dist/build').default;
const { parse } = require('url');

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

    // NOTE: There's a conflict between Next.js handler and express handler in third argument
    // Next.js one expects optional parsed string, while express gives next callback
    // https://nextjs.org/docs/pages/guides/custom-server
    const nextHandler = nextApp.getRequestHandler();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function expressHandler(req, res, _next) {
      const parsedUrl = parse(req.url, true);
      return nextHandler(req, res, parsedUrl);
    };
  }

  async build() {
    return nextBuild(this._dir);
  }
}

module.exports = {
  NextApp,
};
