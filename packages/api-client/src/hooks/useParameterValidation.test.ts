import { describe, it, expect } from 'vitest'
import { useParameterValidation } from './useParameterValidation'

describe('useParameterValidation', () => {
  it('should return empty set when no example is provided', () => {
    const { validateParameters } = useParameterValidation()
    const invalidParams = new Set<string>()
    validateParameters(null, invalidParams)
    expect(invalidParams.size).toBe(0)
  })

  it('should identify required parameters with empty values', () => {
    const { validateParameters } = useParameterValidation()
    const invalidParams = new Set<string>()

    // Mock a request example
    const example = {
      parameters: {
        path: [{ key: 'planetId', value: '', required: true, enabled: true }],
        query: [{ key: 'limit', value: '', required: false, enabled: true }],
        headers: [{ key: 'Authorization', value: '', required: true, enabled: true }],
        cookies: [],
      },
    }

    validateParameters(example, invalidParams)

    expect(invalidParams.size).toBe(2)
    expect(invalidParams.has('planetId')).toBe(true)
    expect(invalidParams.has('limit')).toBe(false)
    expect(invalidParams.has('Authorization')).toBe(true)
  })

  it('should clear invalid params between validations', () => {
    const { validateParameters } = useParameterValidation()
    const invalidParams = new Set<string>()

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

    validateParameters(example1, invalidParams)
    expect(invalidParams.size).toBe(1)
    expect(invalidParams.has('planetId')).toBe(true)

    validateParameters(example2, invalidParams)
    expect(invalidParams.size).toBe(0)
  })
})
