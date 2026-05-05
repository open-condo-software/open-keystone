const { getPackages } = require('@manypkg/get-packages');
const fs = require('fs');
const path = require('path');

function getPackagePlugins() {
  const rootDir = path.resolve(__dirname, '..');
  const docSections = fs.readdirSync(`${rootDir}/docs/`).filter(dir => {
    const fullDir = path.join(`${rootDir}/docs/`, dir);
    return fs.existsSync(fullDir) && fs.lstatSync(fullDir).isDirectory();
  });

  const packagesDir = path.resolve(rootDir, 'packages');
  const packages = fs
    .readdirSync(packagesDir)
    .map(dir => {
      const fullDir = path.join(packagesDir, dir);
      if (fs.existsSync(fullDir) && fs.lstatSync(fullDir).isDirectory()) {
        const pkgJsonPath = path.join(fullDir, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          return { dir: fullDir, packageJson: require(pkgJsonPath) };
        }
      }
      return null;
    })
    .filter(Boolean);

  return [
    ...docSections.map(name => ({
      resolve: 'gatsby-source-filesystem',
      options: { name, path: `${rootDir}/docs/${name}/` },
    })),
    ...packages
      .filter(({ packageJson }) => !packageJson.private)
      .filter(({ dir }) => fs.existsSync(dir))
      .filter(({ dir }) => !dir.includes('arch'))
      .map(({ dir, packageJson }) => ({
        resolve: 'gatsby-source-filesystem',
        options: {
          // This `name` will show up as `sourceInstanceName` on a node's "parent"
          // See `gatsby-node.js` for where it's used.
          name: packageJson.name,
          path: `${dir}`,
          ignore: [`**/**/CHANGELOG.md`, '**/*.{js,json}'],
        },
      })),
  ];
}

function getGatsbyConfig() {
  const packageFilesPlugins = getPackagePlugins();
  return {
    siteMetadata: {
      title: `KeystoneJS`,
      siteUrl: `https://v5.keystonejs.com`,
      description: `A scalable platform and CMS to build Node.js applications.`,
      twitter: `@open-keystone`,
    },
    plugins: [
      ...packageFilesPlugins,
      `gatsby-plugin-sharp`, // image processing
      `gatsby-plugin-react-helmet`,
      {
        resolve: `gatsby-plugin-manifest`,
        options: {
          name: 'KeystoneJS Docs',
          short_name: 'Docs',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
        },
      },
      {
        resolve: `gatsby-transformer-remark`,
        options: {
          plugins: [
            {
              resolve: `gatsby-remark-images`,
              options: {
                maxWidth: 800,
              },
            },
            `gatsby-remark-autolink-headers`,
            `gatsby-remark-copy-linked-files`,
            { resolve: require.resolve('./plugins/gatsby-remark-fix-links') },
          ],
        },
      },
      {
        resolve: `gatsby-plugin-google-analytics`,
        options: {
          trackingId: 'UA-43970386-3',
          head: true,
        },
      },
      `gatsby-plugin-sitemap`,
    ],
  };
}

module.exports = getGatsbyConfig();
