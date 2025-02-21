import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { hasEmptyRequiredParameter, hasItemProperties, parameterIsInvalid } from './request'

describe('hasAllowedProperties', () => {
  it('should return true if item has a description', () => {
    const item: RequestExampleParameter = {
      key: 'A key',
      value: 'A value',
      description: 'A description',
      enabled: true,
    }
    expect(hasItemProperties(item)).toBe(true)
  })

  it('should return true if item has a type', () => {
    const item: RequestExampleParameter = {
      key: 'A key',
      value: 'A value',
      type: 'string',
      enabled: true,
    }
    expect(hasItemProperties(item)).toBe(true)
  })

  it('should return true if item has a default', () => {
    const item: RequestExampleParameter = {
      key: 'A key',
      value: 'A value',
      default: 'default',
      enabled: true,
    }
    expect(hasItemProperties(item)).toBe(true)
  })

  it('should return true if item has a format', () => {
    const item: RequestExampleParameter = {
      key: 'A key',
      value: 'A value',
      format: 'date-time',
      enabled: true,
    }
    expect(hasItemProperties(item)).toBe(true)
  })

  it('should return false if item has none of the allowed properties', () => {
    const item: RequestExampleParameter = {
      key: 'A key',
      value: 'A value',
      enabled: true,
    }
    expect(hasItemProperties(item)).toBe(false)
  })
})

describe('parameterIsValid', () => {
  it('should return false if value is undefined or empty', () => {
    const item: RequestExampleParameter = {
      key: 'key',
      value: '',
      enabled: true,
    }
    expect(parameterIsInvalid(item).value).toBe(false)
  })

  describe('integer validation', () => {
    it('should validate integer type', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: 'abc',
        type: 'integer',
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe('Value must be a whole number (e.g., 42)')
    })

    it('should validate minimum value', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: '5',
        type: 'integer',
        minimum: 10,
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe('Value must be 10 or greater')
    })

    it('should validate maximum value', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: '15',
        type: 'integer',
        maximum: 10,
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe('Value must be 10 or less')
    })
  })

  describe('string format validation', () => {
    it('should validate date format', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: 'invalid-date',
        type: 'string',
        format: 'date',
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe('Please enter a valid date in YYYY-MM-DD format (e.g., 2024-03-20)')
    })

    it('should validate email format', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: 'invalid-email',
        type: 'string',
        format: 'email',
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe('Please enter a valid email address (e.g., user@example.com)')
    })

    it('should validate date-time format', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: 'invalid-datetime',
        type: 'string',
        format: 'date-time',
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe(
        'Please enter a valid date and time in RFC 3339 format (e.g., 2024-03-20T13:45:30Z)',
      )

      item.value = '2023-04-01T12:00:00Z'
      expect(parameterIsInvalid(item).value).toBe(false)
    })

    it('should validate uri format with various schemes', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: 'invalid-uri',
        type: 'string',
        format: 'uri',
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe('Please enter a valid URI (e.g., https://example.com)')

      item.value = 'http://example.com'
      expect(parameterIsInvalid(item).value).toBe(false)

      item.value = 'ftp://example.com'
      expect(parameterIsInvalid(item).value).toBe(false)

      item.value = 'mailto:user@example.com'
      expect(parameterIsInvalid(item).value).toBe(false)
    })
  })

  describe('valid values', () => {
    it('should return false for valid integer', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: '42',
        type: 'integer',
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe(false)
    })

    it('should return false for valid email', () => {
      const item: RequestExampleParameter = {
        key: 'key',
        value: 'test@example.com',
        type: 'string',
        format: 'email',
        enabled: true,
      }
      expect(parameterIsInvalid(item).value).toBe(false)
    })
  })
})

describe('hasEmptyRequiredParameter', () => {
  it('returns true if required item has empty value', () => {
    const item: RequestExampleParameter = {
      key: 'A key',
      value: '',
      required: true,
      enabled: true,
    }
    expect(hasEmptyRequiredParameter(item)).toBe(true)
  })

  it('returns false if required item has value', () => {
    const item: RequestExampleParameter = {
      key: 'A key',
      value: 'A value',
      required: true,
      enabled: true,
    }
    expect(hasEmptyRequiredParameter(item)).toBe(false)
  })

  it('returns false if non-required item has empty value', () => {
    const item: RequestExampleParameter = {
      key: 'A key',
      value: '',
      required: false,
      enabled: true,
    }
    expect(hasEmptyRequiredParameter(item)).toBe(false)
  })
})
