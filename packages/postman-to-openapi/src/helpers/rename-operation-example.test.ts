import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { expect, it } from 'vitest'

import { dereference } from '@/helpers/dereference'
import { renameOperationExamples } from '@/helpers/rename-operation-example'

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
  expect((dereference(operation.parameters?.[0]) as OpenAPIV3_1.ParameterWithSchemaObject | null)?.examples).toEqual({
    renamed: { value: '1' },
  })
  expect(
    (dereference(operation.parameters?.[0]) as OpenAPIV3_1.ParameterWithSchemaObject | null)?.examples?.default,
  ).toBeUndefined()
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
  const jsonContent = dereference(operation.requestBody)?.content?.['application/json']
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
  expect((dereference(operation.parameters?.[0]) as OpenAPIV3_1.ParameterWithSchemaObject | null)?.examples).toEqual({
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
  expect((dereference(operation.parameters?.[0]) as OpenAPIV3_1.ParameterWithSchemaObject | null)?.examples).toEqual({
    new: { value: 'a' },
  })
  expect((dereference(operation.parameters?.[1]) as OpenAPIV3_1.ParameterWithSchemaObject | null)?.examples).toEqual({
    new: { value: 'b' },
  })
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
  expect(dereference(operation.requestBody)?.content?.['application/json']?.examples).toEqual({
    renamed: { value: {} },
  })
  expect(dereference(operation.requestBody)?.content?.['application/xml']?.examples).toEqual({
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
  expect(
    (dereference(operation.parameters?.[0]) as OpenAPIV3_1.ParameterWithSchemaObject | null)?.examples,
  ).toBeUndefined()
})
