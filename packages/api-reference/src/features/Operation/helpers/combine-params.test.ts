import { describe, it, expect } from 'vitest'
import { combineParams } from './combine-params'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

describe('combineParams', () => {
  it('combines path and operation parameters', () => {
    const pathParams: ParameterObject[] = [
      { name: 'id', in: 'path', required: true },
      { name: 'version', in: 'query', required: false },
    ]

    const operationParams: ParameterObject[] = [
      { name: 'limit', in: 'query', required: false },
      { name: 'offset', in: 'query', required: false },
    ]

    const result = combineParams(pathParams, operationParams)
    expect(result).toHaveLength(4)
    expect(result).toEqual([...pathParams, ...operationParams])
  })

  it('gives operation parameters precedence over path parameters with same name and location', () => {
    const pathParams: ParameterObject[] = [{ name: 'id', in: 'path', required: true, description: 'Path parameter' }]

    const operationParams: ParameterObject[] = [
      { name: 'id', in: 'path', required: false, description: 'Operation parameter' },
    ]

    const result = combineParams(pathParams, operationParams)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(operationParams[0])
  })

  it('handles parameters with same name but different locations', () => {
    const pathParams: ParameterObject[] = [{ name: 'id', in: 'path', required: true }]

    const operationParams: ParameterObject[] = [{ name: 'id', in: 'query', required: false }]

    const result = combineParams(pathParams, operationParams)
    expect(result).toHaveLength(2)
    expect(result).toEqual([...pathParams, ...operationParams])
  })

  it('filters out unresolved references', () => {
    const pathParams: any[] = [
      { name: 'id', in: 'path', required: true },
      {
        $ref: '#/components/parameters/UnresolvedParam',
        '$ref-value': { name: 'username', in: 'query', required: false },
      },
    ]

    const operationParams: any[] = [
      { name: 'limit', in: 'query', required: false },
      {
        $ref: '#/components/parameters/AnotherUnresolved',
        '$ref-value': { name: 'username', in: 'query', required: false },
      },
    ]

    const result = combineParams(pathParams, operationParams)
    expect(result).toHaveLength(3)
    expect(result).toEqual([
      { name: 'id', in: 'path', required: true },
      { name: 'username', in: 'query', required: false },
      { name: 'limit', in: 'query', required: false },
    ])
  })

  it('handles edge case with null values in arrays', () => {
    const pathParams: any[] = [
      { name: 'id', in: 'path', required: true },
      null, // This should be filtered out
    ]

    const operationParams: any[] = [
      { name: 'limit', in: 'query', required: false },
      undefined, // This should be filtered out
    ]

    const result = combineParams(pathParams, operationParams)
    expect(result).toHaveLength(2)
    expect(result).toEqual([
      { name: 'id', in: 'path', required: true },
      { name: 'limit', in: 'query', required: false },
    ])
  })
})
