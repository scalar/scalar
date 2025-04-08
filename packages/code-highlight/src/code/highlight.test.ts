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
})
