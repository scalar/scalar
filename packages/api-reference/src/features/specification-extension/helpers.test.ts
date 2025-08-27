import { getXKeysFromObject } from '@/features/specification-extension/helpers'
import { describe, expect, it } from 'vitest'

describe('helpers', () => {
  describe('getXKeysFromObject', () => {
    it('should create a new object with only the keys starting with "x-"', () => {
      const input = {
        'x-custom-key': 'value',
        'another-key': 'value',
        'x-another-custom-key': 'value',
      }
      const result = getXKeysFromObject(input)
      expect(result).toEqual({
        'x-custom-key': 'value',
        'x-another-custom-key': 'value',
      })
    })

    it('should return an empty object when input is undefined', () => {
      const result = getXKeysFromObject(undefined)
      expect(result).toEqual({})
    })

    it('should return an empty object when no keys start with "x-"', () => {
      const input = {
        'regular-key': 'value',
        'another-key': 'value',
        'some-property': 'value',
      }
      const result = getXKeysFromObject(input)
      expect(result).toEqual({})
    })

    it('should handle an empty object', () => {
      const input = {}
      const result = getXKeysFromObject(input)
      expect(result).toEqual({})
    })

    it('should preserve all x- keys when all keys start with "x-"', () => {
      const input = {
        'x-first': 'value1',
        'x-second': 'value2',
        'x-third': 'value3',
      }
      const result = getXKeysFromObject(input)
      expect(result).toEqual({
        'x-first': 'value1',
        'x-second': 'value2',
        'x-third': 'value3',
      })
    })

    it('should handle different value types for x- keys', () => {
      const input = {
        'x-string': 'string value',
        'x-number': 42,
        'x-boolean': true,
        'x-null': null,
        'x-undefined': undefined,
        'x-object': { nested: 'value' },
        'x-array': [1, 2, 3],
        'regular-key': 'should be filtered out',
      }
      const result = getXKeysFromObject(input)
      expect(result).toEqual({
        'x-string': 'string value',
        'x-number': 42,
        'x-boolean': true,
        'x-null': null,
        'x-undefined': undefined,
        'x-object': { nested: 'value' },
        'x-array': [1, 2, 3],
      })
    })

    it('should be case-sensitive for "x-" prefix', () => {
      const input = {
        'x-lowercase': 'included',
        'X-uppercase': 'excluded',
        'X-Mixed': 'excluded',
        'x-valid': 'included',
      }
      const result = getXKeysFromObject(input)
      expect(result).toEqual({
        'x-lowercase': 'included',
        'x-valid': 'included',
      })
    })

    it('should handle keys that contain "x-" but do not start with it', () => {
      const input = {
        'x-starts-with': 'included',
        'prefix-x-contains': 'excluded',
        'some-x-middle': 'excluded',
        'x-another-valid': 'included',
      }
      const result = getXKeysFromObject(input)
      expect(result).toEqual({
        'x-starts-with': 'included',
        'x-another-valid': 'included',
      })
    })

    it('should handle edge case with just "x-" as key', () => {
      const input = {
        'x-': 'minimal extension key',
        'x-normal': 'normal extension key',
        'x': 'not an extension key',
      }
      const result = getXKeysFromObject(input)
      expect(result).toEqual({
        'x-': 'minimal extension key',
        'x-normal': 'normal extension key',
      })
    })

    it('should handle complex OpenAPI extension scenarios', () => {
      const input = {
        'x-api-id': 'api123',
        'x-rate-limit': { requests: 100, window: '1h' },
        'x-tags': ['internal', 'beta'],
        'x-version': '1.0.0',
        'operationId': 'getUserById', // OpenAPI standard field
        'summary': 'Get user by ID', // OpenAPI standard field
        'x-internal-notes': 'This endpoint is for internal use only',
      }
      const result = getXKeysFromObject(input)
      expect(result).toEqual({
        'x-api-id': 'api123',
        'x-rate-limit': { requests: 100, window: '1h' },
        'x-tags': ['internal', 'beta'],
        'x-version': '1.0.0',
        'x-internal-notes': 'This endpoint is for internal use only',
      })
    })
  })
})
