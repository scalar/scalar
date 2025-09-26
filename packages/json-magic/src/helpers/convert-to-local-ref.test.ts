import { describe, expect, it } from 'vitest'

import { convertToLocalRef } from './convert-to-local-ref'

describe('convertToLocalRef', () => {
  const schemas = new Map([
    ['https://example.com/schema1.json', '/components/schemas/Schema1'],
    ['https://example.com/schema2.json', '/components/schemas/Schema2'],
    ['https://example.com/schema1.json#anchor1', '/components/schemas/Schema1/definitions/Anchor1'],
    ['https://example.com/schema2.json#anchor2', '/components/schemas/Schema2/definitions/Anchor2'],
    ['https://example.com/current.json#currentAnchor', '/components/schemas/Current/definitions/CurrentAnchor'],
  ])

  const currentContext = 'https://example.com/current.json'

  describe('external references with baseUrl', () => {
    it('should resolve external reference without path or anchor', () => {
      const result = convertToLocalRef('https://example.com/schema1.json', currentContext, schemas)

      expect(result).toBe('/components/schemas/Schema1')
    })

    it('should resolve external reference with JSON pointer path', () => {
      const result = convertToLocalRef('https://example.com/schema1.json#/definitions/User', currentContext, schemas)

      expect(result).toBe('/components/schemas/Schema1/definitions/User')
    })

    it('should resolve external reference with anchor', () => {
      const result = convertToLocalRef('https://example.com/schema1.json#anchor1', currentContext, schemas)

      expect(result).toBe('/components/schemas/Schema1/definitions/Anchor1')
    })

    it('should return undefined for external reference not in schemas', () => {
      const result = convertToLocalRef('https://example.com/unknown.json', currentContext, schemas)

      expect(result).toBeUndefined()
    })

    it('should return undefined for external reference with unknown anchor', () => {
      const result = convertToLocalRef('https://example.com/schema1.json#unknownAnchor', currentContext, schemas)

      expect(result).toBeUndefined()
    })
  })

  describe('local references without baseUrl', () => {
    it('should resolve local JSON pointer path', () => {
      const result = convertToLocalRef('#/definitions/User', currentContext, schemas)

      expect(result).toBe('definitions/User')
    })

    it('should resolve local JSON pointer path with multiple segments', () => {
      const result = convertToLocalRef('#/components/schemas/User/properties/name', currentContext, schemas)

      expect(result).toBe('components/schemas/User/properties/name')
    })

    it('should resolve local anchor reference', () => {
      const result = convertToLocalRef('#currentAnchor', currentContext, schemas)

      expect(result).toBe('/components/schemas/Current/definitions/CurrentAnchor')
    })

    it('should return undefined for local anchor not in schemas', () => {
      const result = convertToLocalRef('#unknownAnchor', currentContext, schemas)

      expect(result).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should return undefined for empty reference', () => {
      const result = convertToLocalRef('', currentContext, schemas)

      expect(result).toBeUndefined()
    })

    it('should return undefined for reference with only hash', () => {
      const result = convertToLocalRef('#', currentContext, schemas)

      expect(result).toBeUndefined()
    })

    it('should return undefined for reference with only baseUrl and hash', () => {
      const result = convertToLocalRef('https://example.com/schema1.json#', currentContext, schemas)

      expect(result).toBe('/components/schemas/Schema1')
    })

    it('should handle empty currentContext', () => {
      const result = convertToLocalRef('#anchor', '', schemas)

      expect(result).toBeUndefined()
    })

    it('should handle empty schemas map', () => {
      const emptySchemas = new Map()
      const result = convertToLocalRef('https://example.com/schema1.json', currentContext, emptySchemas)

      expect(result).toBeUndefined()
    })
  })

  describe('complex scenarios', () => {
    it('should handle nested JSON pointer paths', () => {
      const result = convertToLocalRef(
        'https://example.com/schema1.json#/definitions/User/properties/address/properties/street',
        currentContext,
        schemas,
      )

      expect(result).toBe('/components/schemas/Schema1/definitions/User/properties/address/properties/street')
    })

    it('should handle anchor with special characters', () => {
      const schemasWithSpecialChars = new Map([
        ['https://example.com/schema1.json', '/components/schemas/Schema1'],
        [
          'https://example.com/schema1.json#anchor-with-dashes',
          '/components/schemas/Schema1/definitions/AnchorWithDashes',
        ],
        [
          'https://example.com/schema1.json#anchor_with_underscores',
          '/components/schemas/Schema1/definitions/AnchorWithUnderscores',
        ],
      ])

      const result1 = convertToLocalRef(
        'https://example.com/schema1.json#anchor-with-dashes',
        currentContext,
        schemasWithSpecialChars,
      )

      const result2 = convertToLocalRef(
        'https://example.com/schema1.json#anchor_with_underscores',
        currentContext,
        schemasWithSpecialChars,
      )

      expect(result1).toBe('/components/schemas/Schema1/definitions/AnchorWithDashes')
      expect(result2).toBe('/components/schemas/Schema1/definitions/AnchorWithUnderscores')
    })

    it('should handle different schema contexts', () => {
      const differentContext = 'https://example.com/different.json'
      const schemasWithDifferentContext = new Map([
        [
          'https://example.com/different.json#differentAnchor',
          '/components/schemas/Different/definitions/DifferentAnchor',
        ],
      ])

      const result = convertToLocalRef('#differentAnchor', differentContext, schemasWithDifferentContext)

      expect(result).toBe('/components/schemas/Different/definitions/DifferentAnchor')
    })
  })

  describe('real-world examples', () => {
    it('should handle OpenAPI component references', () => {
      const openApiSchemas = new Map([
        ['https://api.example.com/schemas/user.json', '/components/schemas/User'],
        ['https://api.example.com/schemas/user.json#/properties/id', '/components/schemas/User/properties/id'],
        ['https://api.example.com/schemas/user.json#userProfile', '/components/schemas/User/definitions/UserProfile'],
      ])

      const result1 = convertToLocalRef(
        'https://api.example.com/schemas/user.json',
        'https://api.example.com/openapi.json',
        openApiSchemas,
      )

      const result2 = convertToLocalRef(
        'https://api.example.com/schemas/user.json#/properties/name',
        'https://api.example.com/openapi.json',
        openApiSchemas,
      )

      const result3 = convertToLocalRef(
        'https://api.example.com/schemas/user.json#userProfile',
        'https://api.example.com/openapi.json',
        openApiSchemas,
      )

      expect(result1).toBe('/components/schemas/User')
      expect(result2).toBe('/components/schemas/User/properties/name')
      expect(result3).toBe('/components/schemas/User/definitions/UserProfile')
    })

    it('should handle local component references in OpenAPI', () => {
      const openApiSchemas = new Map([
        ['https://api.example.com/openapi.json#userSchema', '/components/schemas/User'],
        ['https://api.example.com/openapi.json#addressSchema', '/components/schemas/Address'],
      ])

      const result1 = convertToLocalRef('#userSchema', 'https://api.example.com/openapi.json', openApiSchemas)

      const result2 = convertToLocalRef(
        '#/components/schemas/User/properties/name',
        'https://api.example.com/openapi.json',
        openApiSchemas,
      )

      expect(result1).toBe('/components/schemas/User')
      expect(result2).toBe('components/schemas/User/properties/name')
    })
  })
})
