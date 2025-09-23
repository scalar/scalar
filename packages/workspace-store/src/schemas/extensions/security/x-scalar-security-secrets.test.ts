import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { XScalarSecretHTTPSchema, XScalarSecretTokenSchema } from './x-scalar-security-secrets'

describe('XScalarSecrets', () => {
  describe('XScalarSecretTokenSchema', () => {
    it('validates a valid secret token', () => {
      const validToken = {
        'x-scalar-secret-token': 'sk-1234567890abcdef',
      }

      const result = Value.Parse(XScalarSecretTokenSchema, validToken)
      expect(result).toEqual(validToken)
    })

    it('coerces non-string token values', () => {
      const result = Value.Parse(XScalarSecretTokenSchema, {
        'x-scalar-secret-token': 12345,
      })
      expect(result).toEqual({
        'x-scalar-secret-token': '12345',
      })
    })
  })

  describe('XScalarSecretHTTPSchema', () => {
    it('validates a valid HTTP secret with both username and password', () => {
      const validHttpSecret = {
        'x-scalar-secret-username': 'admin_user',
        'x-scalar-secret-password': 'secure_password_123!',
      }

      const result = Value.Parse(XScalarSecretHTTPSchema, validHttpSecret)
      expect(result).toEqual(validHttpSecret)
    })

    it('rejects non-string values for username and password', () => {
      expect(() => {
        Value.Parse(XScalarSecretHTTPSchema, {
          'x-scalar-secret-username': true,
          'x-scalar-secret-password': ['password'],
        })
      }).toThrow()
    })
  })

  describe('Optional field behavior', () => {
    it('validates objects without secret fields', () => {
      const tokenResult = coerceValue(XScalarSecretTokenSchema, {})
      const httpResult = coerceValue(XScalarSecretHTTPSchema, {})

      expect(tokenResult).toEqual({
        'x-scalar-secret-token': '',
      })
      expect(httpResult).toEqual({
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      })
    })
  })
})
