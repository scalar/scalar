import { describe, expect, it } from 'vitest'

import { generateClientOptions } from './generate-client-options'
import { getClientLanguage } from './get-client-language'

describe('get-client-language', () => {
  it('highlights curl with its own grammar and other clients as their target', () => {
    expect(getClientLanguage('shell/curl')).toBe('curl')
    expect(getClientLanguage('shell/wget')).toBe('shell')
    expect(getClientLanguage('python/requests')).toBe('python')
    expect(getClientLanguage('node/fetch')).toBe('node')
  })

  it('reads the language of a custom code sample from its id', () => {
    expect(getClientLanguage('custom/ruby')).toBe('ruby')
    expect(getClientLanguage('custom/python/1')).toBe('python')
    expect(getClientLanguage('custom')).toBe('plaintext')
  })

  it('agrees with the language of every built-in client option', () => {
    for (const option of generateClientOptions().flatMap((group) => group.options)) {
      expect(getClientLanguage(option.id), option.id).toBe(option.lang)
    }
  })
})
