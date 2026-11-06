import { describe, expect, it } from 'vitest'

import { maskCredentialPlaceholders } from './mask-credential-placeholders'

describe('mask-credential-placeholders', () => {
  it.each(['ab', 'a&b', '<secret>', '\"quoted\"', 'foo() + bar'])(
    'masks an inserted secret %s without changing literal code',
    (secret) => {
      const content = `login("${secret}")`
      const resolved = {
        content,
        segments: [
          { value: 'login("', credential: false },
          { value: secret, credential: true },
          { value: '")', credential: false },
        ],
        maskedValues: [secret],
      }
      expect(maskCredentialPlaceholders(resolved)).toBe('login("••••••••")')
      expect(resolved.content).toBe(content)
    },
  )

  it('keeps public values visible unless they contain another secret', () => {
    const segments = [{ value: 'public-id', credential: true }]
    expect(maskCredentialPlaceholders({ content: 'public-id', segments, maskedValues: [] })).toBe('public-id')
    expect(maskCredentialPlaceholders({ content: 'public-id', segments, maskedValues: ['id'] })).toBe('••••••••')
  })
})
