const commitAnalyzer = require('@mono-pub/commit-analyzer');
const git = require('@mono-pub/git');
const github = require('@mono-pub/github');
const npm = require('@mono-pub/npm');
const execa = require('execa');
const publish = require('mono-pub');

/** @type {import('mono-pub').MonoPubPlugin} */
const builder = {
  name: '@open-keystone/preconstruct-builder',
  async prepareAll({ foundPackages }, ctx) {
    await execa('yarn', ['build'], { cwd: ctx.cwd });
  },
};

function getReleaseSection(types, section) {
  return types.map(type => ({ type, section }));
}

const BREAKING_KEYWORDS = [
  'BREAKING CHANGE',
  'BREAKING CHANGES',
  'BREAKING-CHANGE',
  'BREAKING-CHANGES',
];

// NOTE: Edit this list to add / remove packages from auto-release cycle
const RELEASE_LIST = ['packages/*', 'packages/arch/packages/*', '!packages/create-keystone-5-app'];

publish(
  RELEASE_LIST,
  [
    git(),
    github({
      extractCommitsFromSquashed: true,
      releaseNotesOptions: {
        rules: [
          { breaking: true, section: '⚠️ BREAKING CHANGES' },
          { type: 'feat', section: '✨ New Features' },
          ...getReleaseSection(['fix', 'hotfix'], '🐛 Bug Fixes'),
          { type: 'perf', section: '🚀 Performance Improvements' },
          ...getReleaseSection(
            ['docs', 'style', 'refactor', 'test', 'build', 'ci', 'chore', 'revert'],
            '🦖 Other Changes'
          ),
          { dependency: true, section: '🌐 Dependencies' },
        ],
        breakingNoteKeywords: BREAKING_KEYWORDS,
      },
    }),
    commitAnalyzer({
      patchTypes: ['fix', 'hotfix', 'revert', 'perf', 'deps'],
      breakingNoteKeywords: BREAKING_KEYWORDS,
    }),
    builder,
    npm({ provenance: true }),
  ],
  {
    ignoreDependencies: {
      // Dev deps
      '@open-keystone/keystone': ['@open-keystone/test-utils', '@open-keystone/fields'],
      // See original KS notes in packages
      '@open-keystone/adapter-prisma': ['@open-keystone/fields-auto-increment'],
      '@open-keystone/adapter-knex': ['@open-keystone/fields-auto-increment'],
      '@open-keystone/adapter-mongoose': ['@open-keystone/fields-mongoid'],
    },
  }
);
