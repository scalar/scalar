import type { LanguageFn } from 'highlight.js'
import dart from 'highlight.js/lib/languages/dart'
import markdown from 'highlight.js/lib/languages/markdown'
import { describe, expect, it, vi } from 'vitest'

import { standardLanguages } from '@/languages'

import { syntaxHighlight } from './highlight'

describe('syntaxHighlight', () => {
  const mockLanguages: Record<string, LanguageFn> = {
    javascript: () => ({
      name: 'javascript',
      aliases: ['js'],
      contains: [],
    }),
  }

  const defaultOptions = {
    lang: 'javascript',
    languages: mockLanguages,
  }

  const codeExample = `
    fetch('https://galaxy.scalar.com/planets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  `

  it('should return highlighted HTML for a given code string', () => {
    const result = syntaxHighlight(codeExample, defaultOptions)
    expect(result).toContain('class="hljs language-javascript"')
  })

  it('should mask credentials in the code string', () => {
    const codeWithCredentials = `
      fetch('https://galaxy.scalar.com/planets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer secret'
        }
      })
    `
    const options = {
      ...defaultOptions,
      maskCredentials: ['secret'],
    }

    const result = syntaxHighlight(codeWithCredentials, options)
    expect(result).toContain('<span class="credential"><span class="credential-value">secret</span></span>')
  })

  it('should handle line numbers if option is enabled', () => {
    const options = {
      ...defaultOptions,
      lineNumbers: true,
    }

    const result = syntaxHighlight(codeExample, options)
    expect(result).toContain('class="line"')
  })

  it('should correctly work with special characters in credentials', () => {
    const codeExampleWithSpecialChar = `
      const secret = '(secret';
    `
    const options = {
      ...defaultOptions,
      maskCredentials: ['(secret'],
    }

    const result = syntaxHighlight(codeExampleWithSpecialChar, options)
    expect(result).toContain('<span class="credential"><span class="credential-value">(secret</span></span>')
  })

  it('registers the languages once per languages object', () => {
    const javascript = vi.fn<LanguageFn>(() => ({ name: 'javascript', contains: [] }))
    const languages = { javascript }

    syntaxHighlight('const a = 1', { lang: 'javascript', languages })
    syntaxHighlight('const b = 2', { lang: 'javascript', languages })
    syntaxHighlight('const c = 3', { lang: 'javascript', languages, lineNumbers: true })
    expect(javascript).toHaveBeenCalledTimes(1)

    syntaxHighlight('const d = 4', { lang: 'javascript', languages: { javascript } })
    expect(javascript).toHaveBeenCalledTimes(2)
  })

  it('highlights a shared instance the same as a fresh one', () => {
    const samples = [
      { lang: 'json', code: '{\n  "id": 1,\n  "name": "Example",\n  "tags": ["a", null, true]\n}' },
      {
        lang: 'python',
        code: 'import requests\n\nresponse = requests.get("https://example.com")\nprint(response.json())',
      },
      {
        lang: 'curl',
        code: "curl https://example.com/items \\\n  --request POST \\\n  --header 'Content-Type: application/json'",
      },
      { lang: 'html', code: '<div class="a"><script>const a = `${b}`</script></div>' },
      { lang: 'bash', code: 'cat <<EOF\nhello $USER\nEOF' },
      { lang: 'js', code: 'const a = { b: [1, 2] } // comment' },
      { lang: 'yaml', code: 'openapi: 3.1.0\ninfo:\n  title: Example\n' },
      // Unterminated string, so the grammar ends inside a nested mode
      { lang: 'javascript', code: 'const a = "unterminated' },
      // No language and an unregistered one are left unhighlighted
      { lang: '', code: 'const a = 1' },
      { lang: 'not-a-language', code: 'const a = 1' },
    ]

    // A copy of the registry is a new key, so it gets its own lowlight instance
    const fresh = samples.map(({ lang, code }) => syntaxHighlight(code, { lang, languages: { ...standardLanguages } }))

    // Twice through the shared instance, so later samples run after every grammar has been used
    const shared = [...samples, ...samples].map(({ lang, code }) =>
      syntaxHighlight(code, { lang, languages: standardLanguages }),
    )

    expect(shared).toEqual([...fresh, ...fresh])
    expect(fresh[0]).toContain('hljs-attr')
  })

  it('keeps embedded code after a grammar fails to compile', () => {
    // An invalid keyword pattern stands in for a grammar whose regex a minifier mangled
    const xml: LanguageFn = () => ({ name: 'xml', keywords: { $pattern: '[' }, contains: [] })
    const code = 'Some <b>bold</b> text'
    const escaped = 'Some &#x3C;b>bold&#x3C;/b> text'

    // Markdown embeds xml, so the failure reaches the call
    const direct = { markdown, xml }
    expect(syntaxHighlight(code, { lang: 'markdown', languages: direct })).toContain(escaped)
    expect(syntaxHighlight(code, { lang: 'markdown', languages: direct })).toContain(escaped)

    // A Dart doc comment embeds markdown, so highlight.js swallows the failure two levels down
    const nested = { dart, markdown, xml }
    syntaxHighlight(`/// ${code}\nvoid main() {}`, { lang: 'dart', languages: nested })
    expect(syntaxHighlight(code, { lang: 'markdown', languages: nested })).toContain(escaped)
  })
})
