const got = require('got');
const stream = require('stream');
const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

const REPO_NAME = 'open-condo-software/open-keystone';
const PACKAGE_NAME = 'create-open-keystone-app';
const GITHUB_API_REPO_URL = `https://api.github.com/repos/${REPO_NAME}`;
const GITHUB_CONTENT_API_URL = `https://raw.githubusercontent.com/${REPO_NAME}`;
const GITHUB_RELEASE_API_URL = `${GITHUB_API_REPO_URL}/commits?path=.github/release-count`;

let cachedLatestVersionCommit;

const getLatestVersionCommit = async () => {
  if (cachedLatestVersionCommit === undefined) {
    let commits = await got.get(GITHUB_RELEASE_API_URL).json();
    if (!commits.length) {
      throw new Error(
        `No commits that release keystone were found. Try updating ${PACKAGE_NAME} and if this problem persists, please open an issue on GitHub.`
      );
    }
    cachedLatestVersionCommit = commits[0].sha;
  }
  return cachedLatestVersionCommit;
};

const writeDirectoryFromGitHubToFs = async (from, to) => {
  const latestVersionCommit = await getLatestVersionCommit();
  const { tree } = await got(
    `${GITHUB_API_REPO_URL}/git/trees/${latestVersionCommit}?recursive=1`
  ).json();
  await Promise.all(
    tree.map(async item => {
      if (item.type === 'blob' && item.path.startsWith(from)) {
        let pathToWrite = path.join(to, item.path.replace(from, ''));
        await fs.ensureDir(path.dirname(pathToWrite));
        await pipeline(
          got.stream(`${GITHUB_CONTENT_API_URL}/${latestVersionCommit}/${item.path}`),
          fs.createWriteStream(pathToWrite)
        );
      }
    })
  );
};

const getExampleProjects = async () => {
  let latestVersionCommit = await getLatestVersionCommit();
  try {
    let { body: rawConfig } = await got.get(
      `${GITHUB_CONTENT_API_URL}/${latestVersionCommit}/packages/${PACKAGE_NAME}/example-projects/examples.json`
    );
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(rawConfig);
    } catch {
      throw new Error(
        `The examples file from GitHub could not be parsed. Try updating ${PACKAGE_NAME} and if this problem persists, please open an issue on GitHub.`
      );
    }
    if (parsedConfig.version !== 1) {
      throw new Error(
        `The version of the examples file from GitHub conflicts with ${PACKAGE_NAME}'s version. Try updating ${PACKAGE_NAME} and if this problem persists, please open an issue on GitHub.`
      );
    }
    return parsedConfig.projects;
  } catch (err) {
    if (err instanceof got.HTTPError) {
      throw new Error(
        `The examples file from GitHub could not be found. Try updating ${PACKAGE_NAME} and if this problem persists, please open an issue on GitHub.`
      );
    }
    throw err;
  }
};

module.exports = { getExampleProjects, writeDirectoryFromGitHubToFs };
