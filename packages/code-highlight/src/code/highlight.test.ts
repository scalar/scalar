import { describe, expect, it } from 'vitest'

import { syntaxHighlight } from './highlight'

describe('syntaxHighlight', () => {
  const codeExample = `
    fetch('https://galaxy.scalar.com/planets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  `

  it('returns highlighted HTML for a given code string', async () => {
    const result = await syntaxHighlight(codeExample, { lang: 'javascript' })

    expect(result).toContain('class="scalar-code-highlight language-javascript"')
    // Tokens are wrapped in spans with inline styles that reference Scalar's CSS variables
    expect(result).toContain('var(--scalar-color-')
  })

  it('resolves shorthand language aliases', async () => {
    const result = await syntaxHighlight('const x = 1', { lang: 'ts' })

    expect(result).toContain('language-typescript')
  })

  it('falls back to plain text for unknown languages', async () => {
    const result = await syntaxHighlight('just some text', { lang: 'not-a-real-language' })

    expect(result).toContain('class="scalar-code-highlight language-text"')
    expect(result).toContain('just some text')
  })

  it('masks credentials in the code string', async () => {
    const codeWithCredentials = `
      fetch('https://galaxy.scalar.com/planets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer secret'
        }
      })
    `

    const result = await syntaxHighlight(codeWithCredentials, {
      lang: 'javascript',
      maskCredentials: ['secret'],
    })

    expect(result).toContain('<span class="credential"><span class="credential-value">secret</span></span>')
  })

  it('adds line markup when line numbers are enabled', async () => {
    const result = await syntaxHighlight(codeExample, { lang: 'javascript', lineNumbers: true })

    expect(result).toContain('line-numbers')
    expect(result).toContain('class="line"')
    expect(result).toContain('--line-digits:')
  })

  it('works with special characters in credentials', async () => {
    const result = await syntaxHighlight(`const secret = '(secret';`, {
      lang: 'javascript',
      maskCredentials: ['(secret'],
    })

    expect(result).toContain('<span class="credential"><span class="credential-value">(secret</span></span>')
  })
})
