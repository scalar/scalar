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

  it('resolves Elixir regardless of casing and whitespace', () => {
    expect(getLanguageIcon('Elixir')).toBe('programming-language-elixir')
    expect(getLanguageIcon('  ELIXIR  ')).toBe('programming-language-elixir')
  })

  it('resolves common aliases', () => {
    expect(getLanguageIcon('js')).toBe('programming-language-javascript')
    expect(getLanguageIcon('golang')).toBe('programming-language-go')
    expect(getLanguageIcon('node.js')).toBe('programming-language-node')
  })

  it('returns undefined when there is no matching icon', () => {
    expect(getLanguageIcon('Unknown language')).toBeUndefined()
    expect(getLanguageIcon('')).toBeUndefined()
  })
})
