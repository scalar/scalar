import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import { describe, expect, it } from 'vitest'

import { getOperationHeader } from './get-operation-header'

describe('get-operation-header', () => {
  it('finds a parameter with exact name and type match', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'Authorization', in: 'header', required: true },
        { name: 'id', in: 'path', required: true },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'Authorization',
      type: 'header',
    })

    expect(result).toEqual({ name: 'Authorization', in: 'header', required: true })
  })

  it('finds a parameter with case-insensitive name matching', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'Content-Type', in: 'header', required: false },
        { name: 'api-key', in: 'header', required: true },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'CONTENT-TYPE',
      type: 'header',
    })

    expect(result).toEqual({ name: 'Content-Type', in: 'header', required: false })
  })

  it('finds a parameter when searched with different case variations', () => {
    const operation: OperationObject = {
      parameters: [{ name: 'X-API-Key', in: 'header', required: true }],
    }

    const result = getOperationHeader({
      operation,
      name: 'x-api-key',
      type: 'header',
    })

    expect(result).toEqual({ name: 'X-API-Key', in: 'header', required: true })
  })

  it('returns null when parameter name does not match', () => {
    const operation: OperationObject = {
      parameters: [{ name: 'Authorization', in: 'header', required: true }],
    }

    const result = getOperationHeader({
      operation,
      name: 'Content-Type',
      type: 'header',
    })

    expect(result).toBeNull()
  })

  it('returns null when parameter type does not match', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'id', in: 'path', required: true },
        { name: 'filter', in: 'query', required: false },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'id',
      type: 'query',
    })

    expect(result).toBeNull()
  })

  it('returns null when parameters array is empty', () => {
    const operation: OperationObject = {
      parameters: [],
    }

    const result = getOperationHeader({
      operation,
      name: 'Authorization',
      type: 'header',
    })

    expect(result).toBeNull()
  })

  it('returns null when parameters array is undefined', () => {
    const operation: OperationObject = {}

    const result = getOperationHeader({
      operation,
      name: 'Authorization',
      type: 'header',
    })

    expect(result).toBeNull()
  })

  it('finds the correct parameter among multiple parameters', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'Authorization', in: 'header', required: true },
        { name: 'Content-Type', in: 'header', required: false },
        { name: 'Accept', in: 'header', required: false },
        { name: 'id', in: 'path', required: true },
        { name: 'page', in: 'query', required: false },
        { name: 'limit', in: 'query', required: false },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'Accept',
      type: 'header',
    })

    expect(result).toEqual({ name: 'Accept', in: 'header', required: false })
  })

  it('finds path parameters correctly', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'userId', in: 'path', required: true },
        { name: 'postId', in: 'path', required: true },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'userId',
      type: 'path',
    })

    expect(result).toEqual({ name: 'userId', in: 'path', required: true })
  })

  it('finds query parameters correctly', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'page', in: 'query', required: false },
        { name: 'limit', in: 'query', required: false },
        { name: 'sort', in: 'query', required: false },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'sort',
      type: 'query',
    })

    expect(result).toEqual({ name: 'sort', in: 'query', required: false })
  })

  it('finds cookie parameters correctly', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'sessionId', in: 'cookie', required: true },
        { name: 'csrfToken', in: 'cookie', required: false },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'csrfToken',
      type: 'cookie',
    })

    expect(result).toEqual({ name: 'csrfToken', in: 'cookie', required: false })
  })

  it('handles referenced parameters with $ref', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          $ref: '#/components/parameters/AuthHeader',
          '$ref-value': {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
        } as ParameterObject,
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'Authorization',
      type: 'header',
    })

    expect(result).toBeDefined()
    expect(getResolvedRef(result)?.name).toBe('Authorization')
  })

  it('returns the first matching parameter when multiple parameters match', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'X-Custom', in: 'header', required: true },
        { name: 'X-Custom', in: 'header', required: false },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'X-Custom',
      type: 'header',
    })

    // Returns the first matching parameter
    expect(result).toEqual({ name: 'X-Custom', in: 'header', required: true })
  })

  it('handles parameters with additional properties', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          required: true,
          description: 'Bearer token for authentication',
          schema: { type: 'string' },
        } as ParameterObject,
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'Authorization',
      type: 'header',
    })

    expect(result).toEqual({
      name: 'Authorization',
      in: 'header',
      required: true,
      description: 'Bearer token for authentication',
      schema: { type: 'string' },
    })
  })

  it('handles mixed case scenarios with special characters', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'X-API-Key-v2', in: 'header', required: true },
        { name: 'X_Custom_Header', in: 'header', required: false },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'x-api-key-v2',
      type: 'header',
    })

    expect(result).toEqual({ name: 'X-API-Key-v2', in: 'header', required: true })
  })

  it('distinguishes between parameters with same name but different types', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'token', in: 'header', required: false },
        { name: 'token', in: 'query', required: false },
        { name: 'token', in: 'cookie', required: false },
      ],
    }

    const headerResult = getOperationHeader({
      operation,
      name: 'token',
      type: 'header',
    })
    const queryResult = getOperationHeader({
      operation,
      name: 'token',
      type: 'query',
    })
    const cookieResult = getOperationHeader({
      operation,
      name: 'token',
      type: 'cookie',
    })

    expect(headerResult).toEqual({ name: 'token', in: 'header', required: false })
    expect(queryResult).toEqual({ name: 'token', in: 'query', required: false })
    expect(cookieResult).toEqual({ name: 'token', in: 'cookie', required: false })
  })

  it('handles empty string parameter name', () => {
    const operation: OperationObject = {
      parameters: [
        { name: '', in: 'header', required: false },
        { name: 'Authorization', in: 'header', required: true },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: '',
      type: 'header',
    })

    expect(result).toEqual({ name: '', in: 'header', required: false })
  })

  it('handles parameters with unicode characters', () => {
    const operation: OperationObject = {
      parameters: [
        { name: 'X-Custom-Héader', in: 'header', required: true },
        { name: 'X-日本語', in: 'header', required: false },
      ],
    }

    const result = getOperationHeader({
      operation,
      name: 'x-custom-héader',
      type: 'header',
    })

    expect(result).toEqual({ name: 'X-Custom-Héader', in: 'header', required: true })
  })
})
