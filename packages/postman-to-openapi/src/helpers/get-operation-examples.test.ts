import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { expect, it } from 'vitest'

import { getOperationExamples } from '@/helpers/get-operation-examples'

it('returns empty set for path with no operations', () => {
  const path: OpenAPIV3_1.PathItemObject = {}
  const result = getOperationExamples(path)
  expect(result.size).toBe(0)
})

it('returns empty set for path with operation that has no parameters or requestBody', () => {
  const path: OpenAPIV3_1.PathItemObject = {
    get: {
      summary: 'Get',
      responses: {},
    },
  }
  const result = getOperationExamples(path)
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
  const result = getOperationExamples(path)
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
  const result = getOperationExamples(path)
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
  const result = getOperationExamples(path)
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
  const result = getOperationExamples(path)
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
  const result = getOperationExamples(path)
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
  const result = getOperationExamples(path)
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
  const result = getOperationExamples(path)
  expect(result.size).toBe(2)
  expect(result.has('json')).toBe(true)
  expect(result.has('xml')).toBe(true)
})

it('does not throw when path item has summary, description, servers, or parameters', () => {
  const path: OpenAPIV3_1.PathItemObject = {
    summary: 'Path summary',
    description: 'Path description',
    servers: [{ url: 'https://api.example.com' }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ],
    get: {
      responses: {},
    },
  }
  const result = getOperationExamples(path)
  expect(result.size).toBe(0)
})
