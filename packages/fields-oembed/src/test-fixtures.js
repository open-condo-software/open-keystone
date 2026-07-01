const { Text } = require('@open-keystone/fields');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

import { OEmbed } from './';

export const name = 'OEmbed';
export const type = OEmbed;
export const exampleValue = () => 'https://jestjs.io';
export const exampleValue2 = () => 'https://codesandbox.io';
export const supportsUnique = false;
export const fieldName = 'portfolio';
export const subfieldName = 'originalUrl';

class MockOEmbedAdapter {
  constructor({ apiKey, parameters } = {}) {
    this.apiKey = apiKey;
    this.parameters = parameters;
  }
  fetch(parameters = {}) {
    return Promise.resolve({
      type: 'link',
      version: '1.0',
      title: 'Mock Title',
      author_name: 'Mock Author',
      author_url: 'https://mock.com/author',
      provider_name: 'Mock Provider',
      provider_url: 'https://mock.com/provider',
      cache_age: 3600,
      thumbnail_url: 'https://mock.com/thumbnail.png',
      thumbnail_width: 100,
      thumbnail_height: 100,
      url: parameters.url,
      html: '<div>Mock HTML</div>',
      width: 800,
      height: 600,
    });
  }
  getAdminViews() {
    return [];
  }
  getViewOptions() {
    return {
      clientApiKey: this.apiKey,
    };
  }
}

const iframelyAdapter = new MockOEmbedAdapter({
  apiKey: process.env.IFRAMELY_API_KEY || 'iframely_api_key',
});

export const fieldConfig = () => ({ adapter: iframelyAdapter });

export const getTestFields = () => ({
  name: { type: Text },
  portfolio: { type, adapter: iframelyAdapter },
});

export const initItems = () => {
  return [
    { name: 'a', portfolio: 'https://github.com' },
    { name: 'b', portfolio: 'https://keystonejs.com' },
    { name: 'c', portfolio: 'https://reactjs.org' },
    { name: 'd', portfolio: 'https://REACTJS.ORG' },
    { name: 'e', portfolio: 'https://google.com' },
    { name: 'f', portfolio: null },
    { name: 'g' },
  ];
};

export const storedValues = () => [
  { name: 'a', portfolio: { originalUrl: 'https://github.com' } },
  { name: 'b', portfolio: { originalUrl: 'https://keystonejs.com' } },
  { name: 'c', portfolio: { originalUrl: 'https://reactjs.org' } },
  { name: 'd', portfolio: { originalUrl: 'https://REACTJS.ORG' } },
  { name: 'e', portfolio: { originalUrl: 'https://google.com' } },
  { name: 'f', portfolio: null },
  { name: 'g', portfolio: null },
];

export const supportedFilters = adapterName => [
  'null_equality',
  adapterName !== 'prisma_postgresql' && 'in_empty_null',
];
