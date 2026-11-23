import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { assert, expect, it } from 'vitest'

import { mergeOperations } from '@/helpers/merge-operation'
import {
  POSTMAN_EXAMPLE_NAME_EXTENSION,
  POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION,
  POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION,
  parseStatusCodeFromRequestName,
} from '@/helpers/path-items'

it('returns an object based on operation2 with operation2 fields preserved', () => {
  const op1: OpenAPIV3_1.OperationObject = { summary: 'First', responses: {} }
  const op2: OpenAPIV3_1.OperationObject = { summary: 'Second', description: 'Op2', responses: {} }
  const result = mergeOperations(op1, op2)
  expect(result.summary).toBe('First')
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

it('does not create empty examples map when both media types have no examples', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    requestBody: {
      content: {
        'application/json': {
          schema: { type: 'object' },
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
        },
      },
    },
    responses: {},
  }
  const result = mergeOperations(op1, op2)
  expect(result.requestBody?.content?.['application/json']?.examples).toBeUndefined()
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

it('keeps the shortest summary and merges distinct descriptions', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    summary: '200 - Valid country code languages',
    description: 'Returns languages for a specific country code.',
    responses: {},
  }
  const op2: OpenAPIV3_1.OperationObject = {
    summary: '200 - All languages',
    description: 'Returns all supported languages.',
    responses: {},
  }
  const result = mergeOperations(op1, op2)
  expect(result.summary).toBe('200 - All languages')
  expect(result.description).toBe('Returns languages for a specific country code.\n\nReturns all supported languages.')
})

it('unions responses from both merged operations', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    responses: {
      '404': {
        description: 'Not found',
      },
    },
  }
  const op2: OpenAPIV3_1.OperationObject = {
    responses: {
      '200': {
        description: 'OK',
      },
    },
  }
  const result = mergeOperations(op1, op2)
  expect(result.responses).toEqual({
    '404': {
      description: 'Not found',
    },
    '200': {
      description: 'OK',
    },
  })
})

it('keeps existing requestBody schema while collecting examples', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              firstOnly: { type: 'string' },
            },
          },
          examples: {
            Register: {
              value: '{"name":"first"}',
            },
          },
        },
      },
    },
    responses: {},
  }
  const op2: OpenAPIV3_1.OperationObject = {
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              secondOnly: { type: 'string' },
            },
          },
          examples: {
            'Register same': {
              value: '{"name":"same"}',
            },
          },
        },
      },
    },
    responses: {},
  }
  const result = mergeOperations(op1, op2)
  expect(result.requestBody?.content?.['application/json']).toEqual({
    schema: {
      type: 'object',
      properties: {
        firstOnly: { type: 'string' },
      },
    },
    examples: {
      'Register same': {
        value: '{"name":"same"}',
      },
      Register: {
        value: '{"name":"first"}',
      },
    },
  })
})

it('concatenates script extensions with source separators', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    responses: {},
    [POSTMAN_EXAMPLE_NAME_EXTENSION]: '200 - All languages',
    [POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION]: {
      '200 - All languages': 'pm.environment.set("countryCode", "CA");',
    },
    [POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION]: {
      '200 - All languages': 'pm.test("status is 200", () => pm.response.to.have.status(200));',
    },
  }
  const op2: OpenAPIV3_1.OperationObject = {
    responses: {},
    [POSTMAN_EXAMPLE_NAME_EXTENSION]: '204 - Invalid country code filter',
    [POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION]: {
      '204 - Invalid country code filter': 'pm.environment.set("countryCode", "zz");',
    },
    [POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION]: {
      '204 - Invalid country code filter': 'pm.test("status is 204", () => pm.response.to.have.status(204));',
    },
  }
  const result = mergeOperations(op1, op2)

  expect(result[POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION]).toEqual({
    '200 - All languages': 'pm.environment.set("countryCode", "CA");',
    '204 - Invalid country code filter': 'pm.environment.set("countryCode", "zz");',
  })
  expect(result[POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION]).toEqual({
    '200 - All languages': 'pm.test("status is 200", () => pm.response.to.have.status(200));',
    '204 - Invalid country code filter': 'pm.test("status is 204", () => pm.response.to.have.status(204));',
  })

  expect(result['x-pre-request']).toBe(
    '// --- 200 - All languages ---\npm.environment.set("countryCode", "CA");\n\n// --- 204 - Invalid country code filter ---\npm.environment.set("countryCode", "zz");',
  )
  expect(result['x-post-response']).toBe(
    '// --- 200 - All languages ---\npm.test("status is 200", () => pm.response.to.have.status(200));\n\n// --- 204 - Invalid country code filter ---\npm.test("status is 204", () => pm.response.to.have.status(204));',
  )
})

it('falls back to legacy script extensions when source maps are missing', () => {
  const op1: OpenAPIV3_1.OperationObject = {
    responses: {},
    [POSTMAN_EXAMPLE_NAME_EXTENSION]: 'Variant A',
    'x-pre-request': 'pm.environment.set("variant", "A");',
  }
  const op2: OpenAPIV3_1.OperationObject = {
    responses: {},
    [POSTMAN_EXAMPLE_NAME_EXTENSION]: 'Variant B',
    'x-pre-request': 'pm.environment.set("variant", "B");',
  }
  const result = mergeOperations(op1, op2)
  expect(result['x-pre-request']).toBe(
    '// --- Variant A ---\npm.environment.set("variant", "A");\n\n// --- Variant B ---\npm.environment.set("variant", "B");',
  )
})

it('parses status code and description from request names', () => {
  expect(parseStatusCodeFromRequestName('204 - Invalid country code filter')).toEqual({
    statusCode: '204',
    description: 'Invalid country code filter',
  })
  expect(parseStatusCodeFromRequestName('invalid name')).toBeNull()
})
