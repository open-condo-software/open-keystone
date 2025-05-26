import path from 'path';

const pkgDir = path.dirname(require.resolve('@open-keystone/fields-cloudinary-image/package.json'));

export const resolveView = pathname => path.join(pkgDir, pathname);
