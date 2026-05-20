import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarSecretHTTP, XScalarSecretRefreshToken, XScalarSecretToken } from './x-scalar-security-secrets'

describe('XScalarSecrets', () => {
  describe('XScalarSecretToken', () => {
    it('validates a valid secret token', () => {
      const validToken = {
        'x-scalar-secret-token': 'sk-1234567890abcdef',
      }

      expect(validate(XScalarSecretToken, validToken)).toBe(true)
      expect(coerce(XScalarSecretToken, validToken)).toEqual(validToken)
    })

    it('coerces invalid values to empty string', () => {
      expect(
        coerce(XScalarSecretToken, {
          'x-scalar-secret-token': 12345,
        }),
      ).toEqual({
        'x-scalar-secret-token': '',
      })
    })
  })

  describe('XScalarSecretRefreshToken', () => {
    it('validates a valid refresh token', () => {
      const validRefreshToken = {
        'x-scalar-secret-refresh-token': 'refresh-token-123',
      }

      expect(validate(XScalarSecretRefreshToken, validRefreshToken)).toBe(true)
      expect(coerce(XScalarSecretRefreshToken, validRefreshToken)).toEqual(validRefreshToken)
    })

    it('keeps refresh token optional', () => {
      expect(validate(XScalarSecretRefreshToken, {})).toBe(true)
      expect(coerce(XScalarSecretRefreshToken, {})).toEqual({})
    })
  })

  describe('XScalarSecretHTTP', () => {
    it('validates a valid HTTP secret with both username and password', () => {
      const validHttpSecret = {
        'x-scalar-secret-username': 'admin_user',
        'x-scalar-secret-password': 'secure_password_123!',
      }

      expect(validate(XScalarSecretHTTP, validHttpSecret)).toBe(true)
      expect(coerce(XScalarSecretHTTP, validHttpSecret)).toEqual(validHttpSecret)
    })

    it('rejects non-string values for username and password', () => {
      expect(
        validate(XScalarSecretHTTP, {
          'x-scalar-secret-username': true,
          'x-scalar-secret-password': ['password'],
        }),
      ).toBe(false)
    })
  })

  describe('Optional field behavior', () => {
    it('coerces objects without secret fields', () => {
      expect(coerce(XScalarSecretToken, {})).toEqual({
        'x-scalar-secret-token': '',
      })
      expect(coerce(XScalarSecretHTTP, {})).toEqual({
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      })
    })
  })
})
