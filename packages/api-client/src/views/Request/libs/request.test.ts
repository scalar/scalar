import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { hasItemProperties } from './request'

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
