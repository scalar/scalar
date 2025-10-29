import { describe, it, expect } from 'vitest'
import { validateParameters } from './validate-parameters'

describe('validateParameters', () => {
  it('should return empty set and no blocking errors when no example is provided', () => {
    const result = validateParameters(null)
    expect(result.invalidParams.size).toBe(0)
    expect(result.hasBlockingErrors).toBe(false)
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

    const result = validateParameters(example)

    expect(result.invalidParams.size).toBe(2)
    expect(result.invalidParams.has('planetId')).toBe(true)
    expect(result.invalidParams.has('limit')).toBe(false)
    expect(result.invalidParams.has('Authorization')).toBe(true)
  })

  it('should set blocking errors only for empty required path parameters', () => {
    const exampleWithPathParam = {
      parameters: {
        path: [{ key: 'id', value: '', required: true, enabled: true }],
        query: [],
        headers: [{ key: 'Authorization', value: '', required: true, enabled: true }],
        cookies: [],
      },
    }

    const result = validateParameters(exampleWithPathParam)
    expect(result.hasBlockingErrors).toBe(true)
    expect(result.invalidParams.has('id')).toBe(true)
    expect(result.invalidParams.has('Authorization')).toBe(true)
  })

  it('should not have blocking errors when only non-path params are empty', () => {
    const example = {
      parameters: {
        path: [],
        query: [{ key: 'limit', value: '', required: true, enabled: true }],
        headers: [{ key: 'Authorization', value: '', required: true, enabled: true }],
        cookies: [],
      },
    }

    const result = validateParameters(example)
    expect(result.hasBlockingErrors).toBe(false)
    expect(result.invalidParams.size).toBe(2)
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

    const result1 = validateParameters(example1)
    expect(result1.invalidParams.size).toBe(1)
    expect(result1.invalidParams.has('planetId')).toBe(true)
    expect(result1.hasBlockingErrors).toBe(true)

    const result2 = validateParameters(example2)
    expect(result2.invalidParams.size).toBe(0)
    expect(result2.hasBlockingErrors).toBe(false)
  })

  it('should not block when path parameters have values', () => {
    const example = {
      parameters: {
        path: [{ key: 'id', value: '123', required: true, enabled: true }],
        query: [],
        headers: [],
        cookies: [],
      },
    }

    const result = validateParameters(example)
    expect(result.hasBlockingErrors).toBe(false)
    expect(result.invalidParams.size).toBe(0)
  })
})
