/** Raw HAR queries and their expected URL literals for clients that serialize repeated names directly. */
export const repeatedQueryCases = [
  {
    name: 'interleaved names',
    url: 'https://example.com',
    queryString: [
      { name: 'ids', value: '1' },
      { name: 'one', value: 'x' },
      { name: 'ids', value: '2' },
    ],
    expected: "'https://example.com?ids=1&one=x&ids=2'",
  },
  {
    name: 'a bracketed name',
    url: 'https://example.com',
    queryString: [
      { name: 'expand[]', value: 'a' },
      { name: 'expand[]', value: 'b' },
    ],
    expected: "'https://example.com?expand%5B%5D=a&expand%5B%5D=b'",
  },
  {
    name: 'empty and special values',
    url: 'https://example.com',
    queryString: [
      { name: 'q', value: '' },
      { name: 'q', value: "it's a&b" },
    ],
    expected: "'https://example.com?q=&q=it\\'s%20a%26b'",
  },
  {
    name: 'a query already in the URL',
    url: 'https://example.com/search?pre=1',
    queryString: [
      { name: 'ids', value: '1' },
      { name: 'ids', value: '2' },
    ],
    expected: "'https://example.com/search?pre=1&ids=1&ids=2'",
  },
  {
    name: 'a prototype name',
    url: 'https://example.com',
    queryString: [
      { name: '__proto__', value: 'a' },
      { name: '__proto__', value: 'b' },
    ],
    expected: "'https://example.com?__proto__=a&__proto__=b'",
  },
]
