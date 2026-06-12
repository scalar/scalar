import type { LanguageFn } from 'highlight.js'
import { describe, expect, it } from 'vitest'

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

  it('returns highlighted HTML for a given code string', () => {
    const result = syntaxHighlight(codeExample, defaultOptions)
    expect(result).toContain('class="hljs language-javascript"')
    expect(result).toContain('var(--scalar-color-orange)')
  })

  it('masks credentials in the code string', () => {
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

  it('handles line numbers if option is enabled', () => {
    const options = {
      ...defaultOptions,
      lineNumbers: true,
    }

    const result = syntaxHighlight(codeExample, options)
    expect(result).toContain('class="line"')
  })

  it('works with special characters in credentials', () => {
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

  it('highlights SDK roadmap languages with Scalar token colors', () => {
    const samples = [
      {
        lang: 'typescript',
        code: `const client = new ScalarClient({ token: 'secret' })
await client.books.list({ limit: 10 })`,
      },
      {
        lang: 'python',
        code: `client = ScalarClient(token="secret")
books = client.books.list(limit=10)`,
      },
      {
        lang: 'go',
        code: `client := scalar.NewClient("secret")
books, err := client.Books.List(ctx, &scalar.ListBooksParams{Limit: 10})`,
      },
      {
        lang: 'kotlin',
        code: `val client = ScalarClient(token = "secret")
val books = client.books.list(limit = 10)`,
      },
      {
        lang: 'ruby',
        code: `client = Scalar::Client.new(token: "secret")
books = client.books.list(limit: 10)`,
      },
      {
        lang: 'java',
        code: `ScalarClient client = new ScalarClient("secret");
List<Book> books = client.books().list(10);`,
      },
      {
        lang: 'csharp',
        code: `var client = new ScalarClient("secret");
var books = await client.Books.ListAsync(limit: 10);`,
      },
      {
        lang: 'php',
        code: `$client = new ScalarClient('secret');
$books = $client->books->list(['limit' => 10]);`,
      },
      {
        lang: 'swift',
        code: `let client = ScalarClient(token: "secret")
let books = try await client.books.list(limit: 10)`,
      },
      {
        lang: 'rust',
        code: `let client = ScalarClient::new("secret");
let books = client.books().list(ListBooksParams { limit: 10 }).await?;`,
      },
      {
        lang: 'dart',
        code: `final client = ScalarClient(token: 'secret');
final books = await client.books.list(limit: 10);`,
      },
      {
        lang: 'cpp',
        code: `ScalarClient client("secret");
auto books = client.books().list(ListBooksParams{.limit = 10});`,
      },
    ]

    const results = samples.map(({ lang, code }) => {
      const html = syntaxHighlight(code, {
        lang,
        languages: mockLanguages,
      })

      return {
        lang,
        colors: Array.from(html.matchAll(/color:var\(--scalar-color-[^)]+\)/g)).map(([color]) => color),
        html,
      }
    })

    expect(
      results.map(({ lang, colors, html }) => ({
        lang,
        hasSeveralTokenColors: new Set(colors).size >= 4,
        hasFunctionColor: html.includes('var(--scalar-color-orange)'),
        hasStringLiteralColor: hasHighlightedSecret(html),
      })),
    ).toStrictEqual([
      { lang: 'typescript', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'python', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'go', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'kotlin', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'ruby', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'java', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'csharp', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'php', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'swift', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'rust', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'dart', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
      { lang: 'cpp', hasSeveralTokenColors: true, hasFunctionColor: true, hasStringLiteralColor: true },
    ])
  })
})

const hasHighlightedSecret = (html: string): boolean =>
  /<span style="color:var\(--scalar-color-(?!2\))[^"]*">["']?secret["']?<\/span>/.test(html)
