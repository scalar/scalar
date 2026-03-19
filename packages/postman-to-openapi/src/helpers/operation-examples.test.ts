import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { getExampleNames, renameOperationExamples } from './operation-examples'

describe('getExampleNames', () => {
  it('returns empty set for path with no operations', () => {
    const path: OpenAPIV3_1.PathItemObject = {}
    const result = getExampleNames(path)
    expect(result.size).toBe(0)
  })

  it('returns empty set for path with operation that has no parameters or requestBody', () => {
    const path: OpenAPIV3_1.PathItemObject = {
      get: {
        summary: 'Get',
        responses: {},
      },
    }
    const result = getExampleNames(path)
    expect(result.size).toBe(0)
  })

  it('returns example names from operation parameters', () => {
    const path: OpenAPIV3_1.PathItemObject = {
      get: {
        parameters: [
          {
            name: 'id',
            in: 'query',
            schema: { type: 'string' },
            examples: {
              default: { value: '1' },
              other: { value: '2' },
            },
          },
        ],
        responses: {},
      },
    }
    const result = getExampleNames(path)
    expect(result.size).toBe(2)
    expect(result.has('default')).toBe(true)
    expect(result.has('other')).toBe(true)
  })

  it('returns example names from operation requestBody content', () => {
    const path: OpenAPIV3_1.PathItemObject = {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
              examples: {
                default: { value: {} },
                success: { value: { id: 1 } },
              },
            },
          },
        },
        responses: {},
      },
    }
    const result = getExampleNames(path)
    expect(result.size).toBe(2)
    expect(result.has('default')).toBe(true)
    expect(result.has('success')).toBe(true)
  })

  it('returns unique example names across multiple operations on the same path', () => {
    const path: OpenAPIV3_1.PathItemObject = {
      get: {
        parameters: [
          {
            name: 'id',
            in: 'query',
            schema: { type: 'string' },
            examples: { default: { value: '1' } },
          },
        ],
        responses: {},
      },
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
              examples: { default: { value: {} } },
            },
          },
        },
        responses: {},
      },
    }
    const result = getExampleNames(path)
    expect(result.size).toBe(1)
    expect(result.has('default')).toBe(true)
  })

  it('collects example names from both parameters and requestBody', () => {
    const path: OpenAPIV3_1.PathItemObject = {
      post: {
        parameters: [
          {
            name: 'x-request-id',
            in: 'header',
            schema: { type: 'string' },
            examples: { trace: { value: 'abc' } },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
              examples: { bodyExample: { value: { foo: true } } },
            },
          },
        },
        responses: {},
      },
    }
    const result = getExampleNames(path)
    expect(result.size).toBe(2)
    expect(result.has('trace')).toBe(true)
    expect(result.has('bodyExample')).toBe(true)
  })

  it('ignores parameters without examples', () => {
    const path: OpenAPIV3_1.PathItemObject = {
      get: {
        parameters: [
          {
            name: 'id',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {},
      },
    }
    const result = getExampleNames(path)
    expect(result.size).toBe(0)
  })

  it('ignores requestBody content without examples', () => {
    const path: OpenAPIV3_1.PathItemObject = {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {},
      },
    }
    const result = getExampleNames(path)
    expect(result.size).toBe(0)
  })

  it('collects from multiple media types in requestBody', () => {
    const path: OpenAPIV3_1.PathItemObject = {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
              examples: { json: { value: {} } },
            },
            'application/xml': {
              schema: { type: 'string' },
              examples: { xml: { value: '<root/>' } },
            },
          },
        },
        responses: {},
      },
    }
    const result = getExampleNames(path)
    expect(result.size).toBe(2)
    expect(result.has('json')).toBe(true)
    expect(result.has('xml')).toBe(true)
  })
})

describe('renameOperationExamples', () => {
  it('renames example in operation parameters', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      parameters: [
        {
          name: 'id',
          in: 'query',
          schema: { type: 'string' },
          examples: { default: { value: '1' } },
        },
      ],
      responses: {},
    }
    renameOperationExamples(operation, 'default', 'renamed')
    expect(operation.parameters?.[0]?.examples).toEqual({ renamed: { value: '1' } })
    expect(operation.parameters?.[0]?.examples?.default).toBeUndefined()
  })

  it('renames example in operation requestBody content', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'object' },
            examples: { default: { value: { foo: true } } },
          },
        },
      },
      responses: {},
    }
    renameOperationExamples(operation, 'default', 'custom')
    const jsonContent = operation.requestBody?.content?.['application/json']
    expect(jsonContent?.examples).toEqual({ custom: { value: { foo: true } } })
    expect(jsonContent?.examples?.default).toBeUndefined()
  })

  it('leaves other example names unchanged when renaming one', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      parameters: [
        {
          name: 'id',
          in: 'query',
          schema: { type: 'string' },
          examples: {
            default: { value: '1' },
            other: { value: '2' },
          },
        },
      ],
      responses: {},
    }
    renameOperationExamples(operation, 'default', 'renamed')
    expect(operation.parameters?.[0]?.examples).toEqual({
      renamed: { value: '1' },
      other: { value: '2' },
    })
  })

  it('renames in all parameters that have the example', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      parameters: [
        {
          name: 'a',
          in: 'query',
          schema: { type: 'string' },
          examples: { default: { value: 'a' } },
        },
        {
          name: 'b',
          in: 'query',
          schema: { type: 'string' },
          examples: { default: { value: 'b' } },
        },
      ],
      responses: {},
    }
    renameOperationExamples(operation, 'default', 'new')
    expect(operation.parameters?.[0]?.examples).toEqual({ new: { value: 'a' } })
    expect(operation.parameters?.[1]?.examples).toEqual({ new: { value: 'b' } })
  })

  it('renames in all requestBody media types that have the example', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'object' },
            examples: { default: { value: {} } },
          },
          'application/xml': {
            schema: { type: 'string' },
            examples: { default: { value: '<root/>' } },
          },
        },
      },
      responses: {},
    }
    renameOperationExamples(operation, 'default', 'renamed')
    expect(operation.requestBody?.content?.['application/json']?.examples).toEqual({
      renamed: { value: {} },
    })
    expect(operation.requestBody?.content?.['application/xml']?.examples).toEqual({
      renamed: { value: '<root/>' },
    })
  })

  it('does not mutate operation when it has no parameters', () => {
    const operation: OpenAPIV3_1.OperationObject = { responses: {} }
    renameOperationExamples(operation, 'default', 'new')
    expect(operation.parameters).toBeUndefined()
  })

  it('does not mutate operation when it has no requestBody', () => {
    const operation: OpenAPIV3_1.OperationObject = { responses: {} }
    renameOperationExamples(operation, 'default', 'new')
    expect(operation.requestBody).toBeUndefined()
  })

  it('does not mutate parameters that have no examples', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      parameters: [
        {
          name: 'id',
          in: 'query',
          schema: { type: 'string' },
        },
      ],
      responses: {},
    }
    renameOperationExamples(operation, 'default', 'new')
    expect(operation.parameters?.[0]?.examples).toBeUndefined()
  })
})
