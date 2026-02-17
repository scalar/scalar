import { describe, expect, it } from 'vitest'

import { extractConfigSecrets, removeSecretFields } from './extract-config-secrets'

describe('extract-config-secrets', () => {
  describe('extractConfigSecrets', () => {
    it('extracts all secret fields when present', () => {
      const input = {
        clientSecret: 'my-client-secret',
        password: 'my-password',
        token: 'my-token',
        username: 'my-username',
        value: 'my-value',
        'x-scalar-client-id': 'my-client-id',
        'x-scalar-redirect-uri': 'https://example.com/callback',
      }

      const result = extractConfigSecrets(input)
      expect(result).toEqual({
        'x-scalar-secret-client-secret': 'my-client-secret',
        'x-scalar-secret-password': 'my-password',
        'x-scalar-secret-token': 'my-value',
        'x-scalar-secret-username': 'my-username',
        'x-scalar-secret-client-id': 'my-client-id',
        'x-scalar-secret-redirect-uri': 'https://example.com/callback',
      })
    })

    it('returns empty object when no secret fields are present', () => {
      const input = {
        someOtherField: 'value',
        anotherField: 'another-value',
      }

      const result = extractConfigSecrets(input)
      expect(result).toEqual({})
    })

    it('ignores non-string values for secret fields', () => {
      const input = {
        clientSecret: 'valid-secret',
        password: 123,
        token: null,
        username: undefined,
        value: { nested: 'object' },
        'x-scalar-client-id': ['array', 'value'],
      }

      const result = extractConfigSecrets(input)
      expect(result).toEqual({
        'x-scalar-secret-client-secret': 'valid-secret',
      })
    })

    it('handles partial input with only some secret fields', () => {
      const input = {
        username: 'admin',
        token: 'bearer-token',
        otherField: 'ignored',
      }

      const result = extractConfigSecrets(input)
      expect(result).toEqual({
        'x-scalar-secret-username': 'admin',
        'x-scalar-secret-token': 'bearer-token',
      })
    })

    it('handles empty input object', () => {
      const input = {}
      const result = extractConfigSecrets(input)
      expect(result).toEqual({})
    })
  })

  describe('removeSecretFields', () => {
    it('removes all secret fields from the object', () => {
      const input = {
        clientSecret: 'my-client-secret',
        password: 'my-password',
        token: 'my-token',
        username: 'my-username',
        value: 'my-value',
        'x-scalar-client-id': 'my-client-id',
        'x-scalar-redirect-uri': 'https://example.com/callback',
        keepThisField: 'should-remain',
        anotherField: 'also-remains',
      }

      const result = removeSecretFields(input)
      expect(result).toEqual({
        keepThisField: 'should-remain',
        anotherField: 'also-remains',
      })
    })

    it('returns empty object when all fields are secrets', () => {
      const input = {
        clientSecret: 'my-client-secret',
        password: 'my-password',
        token: 'my-token',
        username: 'my-username',
        value: 'my-value',
        'x-scalar-client-id': 'my-client-id',
      }

      const result = removeSecretFields(input)
      expect(result).toEqual({})
    })

    it('returns the same object when no secret fields are present', () => {
      const input = {
        someField: 'value',
        anotherField: 'another-value',
        nested: { data: 'structure' },
      }

      const result = removeSecretFields(input)
      expect(result).toEqual({
        someField: 'value',
        anotherField: 'another-value',
        nested: { data: 'structure' },
      })
    })

    it('handles empty input object', () => {
      const input = {}
      const result = removeSecretFields(input)
      expect(result).toEqual({})
    })

    it('removes secret fields regardless of their value type', () => {
      const input = {
        clientSecret: 'string-value',
        password: 123,
        token: null,
        username: undefined,
        value: { nested: 'object' },
        'x-scalar-client-id': ['array', 'value'],
        normalField: 'keep-this',
      }

      const result = removeSecretFields(input)
      expect(result).toEqual({
        normalField: 'keep-this',
      })
    })

    it('preserves non-secret fields with similar names', () => {
      const input = {
        clientSecret: 'remove-this',
        clientId: 'keep-this',
        passwordHash: 'keep-this',
        tokenExpiry: 'keep-this',
        usernameField: 'keep-this',
      }

      const result = removeSecretFields(input)
      expect(result).toEqual({
        clientId: 'keep-this',
        passwordHash: 'keep-this',
        tokenExpiry: 'keep-this',
        usernameField: 'keep-this',
      })
    })
  })
})
