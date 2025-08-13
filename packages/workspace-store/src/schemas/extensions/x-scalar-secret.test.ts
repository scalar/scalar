import { describe, it, expect } from 'vitest'
import { XScalarSecretSchema } from './x-scalar-secret'
import { Value } from '@sinclair/typebox/value'

describe('XScalarSecretSchema', () => {
  describe('valid secret extensions', () => {
    it('should validate basic secret extension', () => {
      const validSecret = {
        'x-scalar-secret-api-key': 'sk-1234567890abcdef',
      }

      const result = Value.Parse(XScalarSecretSchema, validSecret)
      expect(result).toEqual(validSecret)
    })

    it('should validate multiple secret extensions', () => {
      const validSecrets = {
        'x-scalar-secret-api-key': 'sk-1234567890abcdef',
        'x-scalar-secret-database-url': 'postgresql://user:pass@localhost:5432/db',
        'x-scalar-secret-jwt-secret': 'super-secret-jwt-key-123',
      }

      const result = Value.Parse(XScalarSecretSchema, validSecrets)
      expect(result).toEqual(validSecrets)
    })

    it('should validate secret extension with complex string value', () => {
      const validSecret = {
        'x-scalar-secret-complex': '!@#$%^&*()_+-=[]{}|;:,.<>?/~`',
      }

      const result = Value.Parse(XScalarSecretSchema, validSecret)
      expect(result).toEqual(validSecret)
    })

    it('should validate empty string value', () => {
      const validSecret = {
        'x-scalar-secret-empty': '',
      }

      const result = Value.Parse(XScalarSecretSchema, validSecret)
      expect(result).toEqual(validSecret)
    })
  })

  describe('invalid secret extensions', () => {
    it('should coerce non-string values', () => {
      const invalidSecret = {
        'x-scalar-secret-number': 123,
      }

      const result = Value.Parse(XScalarSecretSchema, invalidSecret)
      expect(result).toEqual({
        'x-scalar-secret-number': '123',
      })
    })

    it('should coerce boolean values', () => {
      const invalidSecret = {
        'x-scalar-secret-boolean': true,
      }

      const result = Value.Parse(XScalarSecretSchema, invalidSecret)
      expect(result).toEqual({
        'x-scalar-secret-boolean': 'true',
      })
    })

    it('should throw on null values', () => {
      const invalidSecret = {
        'x-scalar-secret-null': null,
      }

      expect(() => Value.Parse(XScalarSecretSchema, invalidSecret)).toThrow()
    })

    it('should throw on undefined values', () => {
      const invalidSecret = {
        'x-scalar-secret-undefined': undefined,
      }

      expect(() => Value.Parse(XScalarSecretSchema, invalidSecret)).toThrow()
    })
  })
})
