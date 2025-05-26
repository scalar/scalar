import { describe, it, expect } from 'vitest'
import { isObject, isReferenceObject, isValidOpenApiDocument } from './type-guards'

describe('type-guards', () => {
  describe('isObject', () => {
    it('returns true for plain objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ key: 'value' })).toBe(true)
      expect(isObject({ nested: { key: 'value' } })).toBe(true)
    })

    it('returns false for arrays', () => {
      expect(isObject([])).toBe(false)
      expect(isObject([1, 2, 3])).toBe(false)
      expect(isObject([{ key: 'value' }])).toBe(false)
    })

    it('returns false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it('returns false for primitive values', () => {
      expect(isObject(undefined)).toBe(false)
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(Symbol())).toBe(false)
    })
  })

  describe('isReferenceObject', () => {
    it('returns true for objects with $ref string property', () => {
      expect(isReferenceObject({ $ref: '#/components/schemas/User' })).toBe(true)
      expect(isReferenceObject({ $ref: '#/definitions/Error' })).toBe(true)
    })

    it('returns false for objects without $ref property', () => {
      expect(isReferenceObject({})).toBe(false)
      expect(isReferenceObject({ ref: '#/components/schemas/User' })).toBe(false)
    })

    it('returns false for objects with non-string $ref', () => {
      expect(isReferenceObject({ $ref: 123 })).toBe(false)
      expect(isReferenceObject({ $ref: null })).toBe(false)
      expect(isReferenceObject({ $ref: undefined })).toBe(false)
    })

    it('returns false for non-objects', () => {
      expect(isReferenceObject(null)).toBe(false)
      expect(isReferenceObject(undefined)).toBe(false)
      expect(isReferenceObject('string')).toBe(false)
      expect(isReferenceObject([])).toBe(false)
    })
  })

  describe('isValidOpenApiDocument', () => {
    it('returns true for valid OpenAPI 3.x documents', () => {
      expect(isValidOpenApiDocument({ openapi: '3.0.0' })).toBe(true)
      expect(isValidOpenApiDocument({ openapi: '3.1.0' })).toBe(true)
      expect(
        isValidOpenApiDocument({
          openapi: '3.0.0',
          info: { title: 'API', version: '1.0.0' },
        }),
      ).toBe(true)
    })

    it('returns true for valid Swagger documents', () => {
      expect(isValidOpenApiDocument({ swagger: '2.0' })).toBe(true)
      expect(
        isValidOpenApiDocument({
          swagger: '2.0',
          info: { title: 'API', version: '1.0.0' },
        }),
      ).toBe(true)
    })

    it('returns false for objects without openapi or swagger property', () => {
      expect(isValidOpenApiDocument({})).toBe(false)
      expect(isValidOpenApiDocument({ info: { title: 'API' } })).toBe(false)
    })

    it('returns false for objects with non-string openapi/swagger', () => {
      expect(isValidOpenApiDocument({ openapi: 3 })).toBe(false)
      expect(isValidOpenApiDocument({ swagger: 2 })).toBe(false)
    })

    it('returns false for non-objects', () => {
      expect(isValidOpenApiDocument(null)).toBe(false)
      expect(isValidOpenApiDocument(undefined)).toBe(false)
      expect(isValidOpenApiDocument('string')).toBe(false)
      expect(isValidOpenApiDocument([])).toBe(false)
    })
  })
})
