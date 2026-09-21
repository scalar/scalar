import { describe, expect, it } from 'vitest'

import { syntaxHighlight } from '../code/highlight'
import { standardLanguages } from '../languages/standard'
import { loadLanguages } from './languages'

describe('languages', () => {
  it('loads only the requested grammar', async () => {
    expect(Object.keys(await loadLanguages(['python']))).toStrictEqual(['python'])
  })

  it('loads embedded HTML, JavaScript and CSS together', async () => {
    expect(Object.keys(await loadLanguages(['html']))).toStrictEqual(['xml', 'css', 'javascript', 'graphql'])
  })

  it.each([
    ['py', 'print("hello")'],
    ['js', 'const answer = 42'],
    ['c++', 'int main() { return 0; }'],
    ['yml', 'answer: 42'],
    ['javascript', 'const query = gql`query { users { id } }`'],
    ['http', 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id": 42}'],
    ['curl', 'curl https://example.com'],
    ['json', '{"answer":42}'],
    ['html', '<style>body { color: red; }</style><script>const x = 1;</script>'],
  ])('preserves highlighting for %s', async (lang, code) => {
    expect(syntaxHighlight(code, { lang, languages: await loadLanguages([lang]) })).toBe(
      syntaxHighlight(code, { lang, languages: standardLanguages }),
    )
  })

  it('leaves unknown languages as escaped text', async () => {
    const languages = await loadLanguages(['unknown', 'constructor'])
    expect(languages).toStrictEqual({})
    expect(syntaxHighlight('<script>alert(1)</script>', { lang: 'unknown', languages })).toBe(
      '<pre><code class="hljs language-unknown">&#x3C;script>alert(1)&#x3C;/script></code></pre>',
    )
  })
})
