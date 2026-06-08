import { describe, expect, it } from 'vitest'

import { getLanguageIcon } from './language-icon'

describe('getLanguageIcon', () => {
  it('resolves known languages to their icon', () => {
    expect(getLanguageIcon('Node')).toBe('programming-language-node')
    expect(getLanguageIcon('Python')).toBe('programming-language-python')
  })

  it('is case and whitespace insensitive', () => {
    expect(getLanguageIcon('  PYTHON  ')).toBe('programming-language-python')
  })

  it('resolves common aliases', () => {
    expect(getLanguageIcon('js')).toBe('programming-language-javascript')
    expect(getLanguageIcon('golang')).toBe('programming-language-go')
    expect(getLanguageIcon('node.js')).toBe('programming-language-node')
  })

  it('returns undefined when there is no matching icon', () => {
    expect(getLanguageIcon('Elixir')).toBeUndefined()
    expect(getLanguageIcon('')).toBeUndefined()
  })
})
