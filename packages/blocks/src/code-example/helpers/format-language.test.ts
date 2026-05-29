import { describe, expect, it } from 'vitest'

import { formatLanguage } from './format-language'

describe('format-language', () => {
  it('maps common languages to their display names', () => {
    expect(formatLanguage('typescript')).toBe('TypeScript')
    expect(formatLanguage('javascript')).toBe('JavaScript')
    expect(formatLanguage('python')).toBe('Python')
    expect(formatLanguage('csharp')).toBe('C#')
    expect(formatLanguage('node')).toBe('Node.js')
    expect(formatLanguage('curl')).toBe('cURL')
  })

  it('is case insensitive', () => {
    expect(formatLanguage('TypeScript')).toBe('TypeScript')
    expect(formatLanguage('PYTHON')).toBe('Python')
  })

  it('falls back to a simple capitalization for unknown languages', () => {
    expect(formatLanguage('cobol')).toBe('Cobol')
  })

  it('returns undefined when no language is given', () => {
    expect(formatLanguage()).toBeUndefined()
    expect(formatLanguage('')).toBeUndefined()
  })
})
