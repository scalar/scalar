import type { ExampleObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createParameterRows } from './create-parameter-rows'

describe('createParameterRows', () => {
  it('expands default form query object parameters into property rows', () => {
    const pageSchema = {
      type: 'integer',
      format: 'int32',
      description: 'Page number',
    } as const
    const sizeSchema = {
      type: 'integer',
      format: 'int32',
      description: 'Page size',
    } as const
    const sortSchema = {
      type: 'array',
      items: { type: 'string' },
    } as const
    const parameter: ParameterObject = {
      name: 'pageable',
      in: 'query',
      required: false,
      schema: {
        type: 'object',
        required: ['page'],
        properties: {
          page: pageSchema,
          size: sizeSchema,
          sort: sortSchema,
        },
      },
      examples: {
        default: {
          value: {
            page: 2,
            sort: ['username,asc'],
          },
          'x-disabled': false,
        },
      },
    }

    expect(createParameterRows(parameter, 'default')).toStrictEqual([
      {
        name: 'page',
        value: '2',
        description: 'Page number',
        schema: pageSchema,
        isRequired: true,
        isDisabled: false,
        originalParameter: parameter,
        sourceParameterValuePath: ['page'],
      },
      {
        name: 'size',
        value: '',
        description: 'Page size',
        schema: sizeSchema,
        isRequired: false,
        isDisabled: false,
        originalParameter: parameter,
        sourceParameterValuePath: ['size'],
      },
      {
        name: 'sort',
        value: 'username,asc',
        description: undefined,
        schema: sortSchema,
        isRequired: false,
        isDisabled: false,
        originalParameter: parameter,
        sourceParameterValuePath: ['sort'],
      },
    ])
  })

  it('expands deepObject query parameters into bracket rows', () => {
    const firstNameSchema = {
      type: 'string',
      description: 'First name',
    } as const
    const roleSchema = {
      type: 'string',
    } as const
    const parameter: ParameterObject = {
      name: 'filter',
      in: 'query',
      style: 'deepObject',
      explode: true,
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'object',
            properties: {
              first: firstNameSchema,
            },
          },
          role: roleSchema,
        },
      },
      examples: {
        default: {
          value: {
            name: {
              first: 'Alex',
            },
            role: 'admin',
          },
          'x-disabled': false,
        },
      },
    }

    expect(createParameterRows(parameter, 'default')).toStrictEqual([
      {
        name: 'filter[name][first]',
        value: 'Alex',
        description: 'First name',
        schema: firstNameSchema,
        isRequired: false,
        isDisabled: false,
        originalParameter: parameter,
        sourceParameterValuePath: ['name', 'first'],
      },
      {
        name: 'filter[role]',
        value: 'admin',
        description: undefined,
        schema: roleSchema,
        isRequired: false,
        isDisabled: false,
        originalParameter: parameter,
        sourceParameterValuePath: ['role'],
      },
    ])
  })

  it('round-trips edited expanded rows back through createParameterRows', () => {
    const parameter: ParameterObject = {
      name: 'pageable',
      in: 'query',
      required: false,
      schema: {
        type: 'object',
        properties: {
          page: { type: 'integer', format: 'int32' },
          size: { type: 'integer', format: 'int32' },
        },
      },
      examples: {
        default: {
          value: { page: 1 },
          'x-disabled': false,
        },
      },
    }

    const initialRows = createParameterRows(parameter, 'default')
    expect(initialRows[0]?.value).toBe('1')
    expect(initialRows[1]?.value).toBe('')

    // Simulate the write-back: the upsert handler would set the example value
    // to the reassembled object (e.g. { page: '1', size: '20' }).
    const example = (parameter.examples as Record<string, ExampleObject>)['default']!
    example.value = { page: '1', size: '20' }

    const updatedRows = createParameterRows(parameter, 'default')
    expect(updatedRows[0]?.value).toBe('1')
    expect(updatedRows[1]?.value).toBe('20')
  })

  it('omits expanded rows hidden by path', () => {
    const parameter: ParameterObject = {
      name: 'pageable',
      in: 'query',
      schema: {
        type: 'object',
        required: ['page'],
        properties: {
          page: { type: 'integer', format: 'int32' },
          size: { type: 'integer', format: 'int32' },
        },
      },
      examples: {
        default: {
          value: {},
          'x-disabled': false,
        },
      },
    }

    expect(
      createParameterRows(parameter, 'default', {
        hiddenValuePaths: [['page']],
      }),
    ).toStrictEqual([
      {
        name: 'size',
        value: '',
        description: undefined,
        schema: { type: 'integer', format: 'int32' },
        isRequired: false,
        isDisabled: false,
        originalParameter: parameter,
        sourceParameterValuePath: ['size'],
      },
    ])
  })

  it('keeps unsupported object serialization as one row', () => {
    const parameter: ParameterObject = {
      name: 'filter',
      in: 'query',
      style: 'form',
      explode: false,
      schema: {
        type: 'object',
        properties: {
          role: { type: 'string' },
        },
      },
      examples: {
        default: {
          value: {
            role: 'admin',
          },
          'x-disabled': false,
        },
      },
    }

    expect(createParameterRows(parameter, 'default')).toStrictEqual([
      {
        name: 'filter',
        value: '{"role":"admin"}',
        description: undefined,
        schema: parameter.schema,
        isRequired: undefined,
        isDisabled: false,
        originalParameter: parameter,
        sourceParameterValuePath: undefined,
      },
    ])
  })
})
