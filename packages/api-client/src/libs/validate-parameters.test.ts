import { describe, it, expect } from 'vitest'
import { validateParameters } from './validate-parameters'

describe('validateParameters', () => {
  it('should return empty set when no example is provided', () => {
    const invalidParams = validateParameters(null)
    expect(invalidParams.size).toBe(0)
  })

  it('should identify required parameters with empty values', () => {
    // Mock a request example
    const example = {
      parameters: {
        path: [{ key: 'planetId', value: '', required: true, enabled: true }],
        query: [{ key: 'limit', value: '', required: false, enabled: true }],
        headers: [{ key: 'Authorization', value: '', required: true, enabled: true }],
        cookies: [],
      },
    }

    const invalidParams = validateParameters(example)

    expect(invalidParams.size).toBe(2)
    expect(invalidParams.has('planetId')).toBe(true)
    expect(invalidParams.has('limit')).toBe(false)
    expect(invalidParams.has('Authorization')).toBe(true)
  })

  it('should clear invalid params between validations', () => {
    // Mock a first request example
    const example1 = {
      parameters: {
        path: [{ key: 'planetId', value: '', required: true, enabled: true }],
        query: [],
        headers: [],
        cookies: [],
      },
    }

    // Mock a second request example
    const example2 = {
      parameters: {
        path: [],
        query: [],
        headers: [],
        cookies: [],
      },
    }

    const invalidParams = validateParameters(example1)
    expect(invalidParams.size).toBe(1)
    expect(invalidParams.has('planetId')).toBe(true)

    const invalidParams2 = validateParameters(example2)
    expect(invalidParams2.size).toBe(0)
  })
})
