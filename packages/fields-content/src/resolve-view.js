import path from 'path';

const pkgDir = path.dirname(require.resolve('@open-keystone/fields-content/package.json'));

export const resolveView = pathname => path.join(pkgDir, pathname);
