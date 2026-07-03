const { escapeRegExp } = require('../src');

describe('escapeRegExp()', () => {
  test('escapeRegExp', () => {
    const s = 'a-b/c[d]e{f}g(h)i*j+k?l.m\\n^o$p|';
    const t = 'a\\-b\\/c\\[d\\]e\\{f\\}g\\(h\\)i\\*j\\+k\\?l\\.m\\\\n\\^o\\$p\\|';
    expect(escapeRegExp(s)).toEqual(t);
    expect(escapeRegExp('abc')).toEqual('abc');
    expect(escapeRegExp('')).toEqual('');
    expect(escapeRegExp(null)).toEqual('');
    expect(escapeRegExp(undefined)).toEqual('');
    expect(escapeRegExp()).toEqual('');
  });

  test('should escape special characters', () => {
    const chars = '-[]/{}()*+?.\\^$|';
    const escaped = '\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|';
    expect(escapeRegExp(chars)).toBe(escaped);
  });

  test('should escape each character individually', () => {
    expect(escapeRegExp('-')).toBe('\\-');
    expect(escapeRegExp('[')).toBe('\\[');
    expect(escapeRegExp(']')).toBe('\\]');
    expect(escapeRegExp('/')).toBe('\\/');
    expect(escapeRegExp('{')).toBe('\\{');
    expect(escapeRegExp('}')).toBe('\\}');
    expect(escapeRegExp('(')).toBe('\\(');
    expect(escapeRegExp(')')).toBe('\\)');
    expect(escapeRegExp('*')).toBe('\\*');
    expect(escapeRegExp('+')).toBe('\\+');
    expect(escapeRegExp('?')).toBe('\\?');
    expect(escapeRegExp('.')).toBe('\\.');
    expect(escapeRegExp('\\')).toBe('\\\\');
    expect(escapeRegExp('^')).toBe('\\^');
    expect(escapeRegExp('$')).toBe('\\$');
    expect(escapeRegExp('|')).toBe('\\|');
  });

  test('should not escape non-special characters', () => {
    const normalChars = 'abcABC123 _';
    expect(escapeRegExp(normalChars)).toBe(normalChars);
  });

  test('should handle empty strings and nullish values', () => {
    expect(escapeRegExp('')).toBe('');
    expect(escapeRegExp(null)).toBe('');
    expect(escapeRegExp(undefined)).toBe('');
    expect(escapeRegExp()).toBe('');
  });

  test('should work correctly when used in a new RegExp', () => {
    const str = 'dot.test';
    const escaped = escapeRegExp(str);
    const re = new RegExp(`^${escaped}$`);

    expect(re.test('dot.test')).toBe(true);
    expect(re.test('dottest')).toBe(false);
    expect(re.test('dot-test')).toBe(false);
  });

  test('should work with complex strings', () => {
    const complex = 'How much is $10.00? (approx. 8€)';
    const expected = 'How much is \\$10\\.00\\? \\(approx\\. 8€\\)';
    expect(escapeRegExp(complex)).toBe(expected);
  });

  test('should escape multiple occurrences', () => {
    expect(escapeRegExp('...')).toBe('\\.\\.\\.');
    expect(escapeRegExp('(((abc)))')).toBe('\\(\\(\\(abc\\)\\)\\)');
  });
});
