import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { assert, expect, it } from 'vitest'

import { mergeOperations } from '@/helpers/merge-operation'

it('returns an object based on operation2 with operation2 fields preserved', () => {
  const op1: OpenAPIV3_1.OperationObject = { summary: 'First', responses: {} }
  const op2: OpenAPIV3_1.OperationObject = { summary: 'Second', description: 'Op2', responses: {} }
  const result = mergeOperations(op1, op2)
  expect(result.summary).toBe('Second')
  expect(result.description).toBe('Op2')
})

it('merges parameter examples when both operations have a parameter with the same name', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    parameters: [
      {
        name: 'id',
        in: 'query',
        schema: { type: 'string' },
        examples: { default: { value: '1' }, other: { value: '2' } },
      },
    ],
    responses: {},
  }
  const op2: OpenAPIV3_1.OperationObject = {
    parameters: [
      {
        name: 'id',
        in: 'query',
        schema: { type: 'string' },
        examples: { incoming: { value: '99' } },
      },
    ],
    responses: {},
  }
  const result = mergeOperations(op1, op2)
  expect(result.parameters).toHaveLength(1)
  assert(result.parameters?.[0])
  expect(result.parameters[0].name).toBe('id')
  expect(result.parameters[0].examples).toEqual({
    incoming: { value: '99' },
    default: { value: '1' },
    other: { value: '2' },
  })
})

it('includes parameters only in operation1 in the result', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    parameters: [{ name: 'extra', in: 'header', schema: { type: 'string' }, examples: { default: { value: 'x' } } }],
    responses: {},
  }
  const op2: OpenAPIV3_1.OperationObject = {
    parameters: [{ name: 'id', in: 'query', schema: { type: 'string' }, examples: { default: { value: '1' } } }],
    responses: {},
  }
  const result = mergeOperations(op1, op2)
  expect(result.parameters).toHaveLength(2)
  const names = result.parameters?.map((p) => p.name).sort() ?? []
  expect(names).toEqual(['extra', 'id'])
})

it('includes parameters only in operation2 in the result', () => {
  const op1: OpenAPIV3_1.OperationObject = { responses: {} }
  const op2: OpenAPIV3_1.OperationObject = {
    parameters: [{ name: 'id', in: 'query', schema: { type: 'string' }, examples: { default: { value: '1' } } }],
    responses: {},
  }
  const result = mergeOperations(op1, op2)
  expect(result.parameters).toHaveLength(1)
  assert(result.parameters?.[0])
  expect(result.parameters[0].name).toBe('id')
})

it('merges request body examples for the same media type', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    requestBody: {
      content: {
        'application/json': {
          schema: { type: 'object' },
          examples: { first: { value: { a: 1 } } },
        },
      },
    },
    responses: {},
  }
  const op2: OpenAPIV3_1.OperationObject = {
    requestBody: {
      content: {
        'application/json': {
          schema: { type: 'object' },
          examples: { second: { value: { b: 2 } } },
        },
      },
    },
    responses: {},
  }
  const result = mergeOperations(op1, op2)
  expect(result.requestBody?.content?.['application/json']?.examples).toEqual({
    second: { value: { b: 2 } },
    first: { value: { a: 1 } },
  })
})

it('includes request body content types from both operations', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    requestBody: {
      content: {
        'application/json': {
          schema: { type: 'object' },
          examples: { newExample: { value: {} } },
        },
        'application/xml': {
          schema: { type: 'object' },
          examples: { default: { value: '<root/>' } },
        },
      },
    },
    responses: {},
  }
  const op2: OpenAPIV3_1.OperationObject = {
    requestBody: {
      content: {
        'application/json': {
          schema: { type: 'object' },
          examples: { default: { value: {} } },
        },
      },
    },
    responses: {},
  }
  const result = mergeOperations(op1, op2)
  expect(result.requestBody).toEqual({
    content: {
      'application/json': {
        schema: { type: 'object' },
        examples: { default: { value: {} }, newExample: { value: {} } },
      },
      'application/xml': {
        schema: { type: 'object' },
        examples: { default: { value: '<root/>' } },
      },
    },
  })
})

it('handles operations with no parameters and no requestBody', () => {
  const op1: OpenAPIV3_1.OperationObject = { summary: 'A', responses: {} }
  const op2: OpenAPIV3_1.OperationObject = { summary: 'B', responses: {} }
  const result = mergeOperations(op1, op2)
  expect(result.summary).toBe('B')
  expect(result.parameters).toBeUndefined()
  expect(result.requestBody).toBeUndefined()
})
