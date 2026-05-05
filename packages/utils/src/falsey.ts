/*!
 * falsey
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 *
 * Source: https://github.com/jonschlinkert/falsey/blob/master/index.js
 */
export const falseyKeywords = [
  '0',
  'false',
  'nada',
  'nil',
  'nay',
  'nah',
  'negative',
  'no',
  'none',
  'nope',
  'nul',
  'null',
  'nix',
  'nyet',
  'uh-uh',
  'veto',
  'zero',
] as const;

export const falsey = (
  val: unknown,
  keywords: ReadonlyArray<string> | string = falseyKeywords
): boolean => {
  if (!val) return true;

  const words = Array.isArray(keywords) ? keywords : [keywords];
  const lower = typeof val === 'string' ? val.toLowerCase() : null;

  for (const word of words) {
    if (word === val || word === lower) {
      return true;
    }
  }

  return false;
};
