import type { ParameterObject, RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getExample } from './get-example'

vi.mock('@scalar/workspace-store/helpers/get-resolved-ref', () => ({
  getResolvedRef: vi.fn((x: unknown) => x),
}))

describe('getExampleValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns value from param.examples by provided key', () => {
    const param = {
      name: 'q',
      in: 'query',
      examples: {
        a: { value: 123 },
        b: { value: 456 },
      },
    } satisfies ParameterObject

    const result = getExample(param, 'b', undefined)
    expect(result?.value).toEqual(456)
  })

  it('returns first value from param.examples when key not provided', () => {
    const param = {
      name: 'q',
      in: 'query',
      examples: {
        first: { value: 'foo' },
        second: { value: 'bar' },
      },
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('foo')
  })

  it('falls back to content.*.examples when param.examples is missing', () => {
    const param = {
      name: 'q',
      in: 'query',
      content: {
        'application/json': {
          examples: {
            sample: { value: { ok: true } },
          },
        },
      },
    }

    const result = getExample(param, 'sample', 'application/json')
    expect(result?.value).toEqual({ ok: true })
  })

  it('uses first media type and first example key when not provided', () => {
    const param = {
      name: 'q',
      in: 'query',
      content: {
        'text/plain': {
          examples: {
            e1: { value: 'hello' },
            e2: { value: 'world' },
          },
        },
      },
    }

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('hello')
  })

  it('returns media.example when examples are not provided', () => {
    const param = {
      name: 'body',
      in: 'query',
      content: {
        'application/json': {
          example: { id: 1 },
        },
      },
    }

    const result = getExample(param, undefined, 'application/json')
    expect(result?.value).toEqual({ id: 1 })
  })

  it('returns deprecated param.example when present and no others match', () => {
    const param = {
      name: 'q',
      in: 'query',
      example: 'fallback',
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('fallback')
  })

  it('returns undefined when no examples or example fields exist', () => {
    const param = {
      name: 'q',
      in: 'query',
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result).toBeUndefined()
  })

  it('returns schema default value when exampleKey does not exist', () => {
    const param = {
      name: 'limit',
      in: 'query',
      examples: {
        large: { value: 100 },
      },
      schema: {
        type: 'integer',
        default: 10,
      },
    } satisfies ParameterObject

    const result = getExample(param, 'nonexistent', undefined)
    expect(result?.value).toEqual(10)
  })

  it('doesnt fallback when wrong example key is provided at param level', () => {
    const param = {
      name: 'q',
      in: 'query',
      examples: {
        a: { value: 'nope' },
      },
      content: {
        'application/json': {
          examples: { b: { value: 'yep' } },
        },
      },
    } satisfies ParameterObject

    const result = getExample(param, 'missing', 'application/json')
    expect(result?.value).toBeUndefined()
  })

  it('returns schema default value for string type', () => {
    const param = {
      name: 'sort',
      in: 'query',
      examples: {},
      schema: {
        type: 'string',
        default: 'createdAt',
      },
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual('createdAt')
  })

  it('returns schema default value for boolean type', () => {
    const param = {
      name: 'includeArchived',
      in: 'query',
      examples: {},
      schema: {
        type: 'boolean',
        default: false,
      },
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual(false)
  })

  it('returns schema default value when default is 0', () => {
    const param = {
      name: 'offset',
      in: 'query',
      examples: {},
      schema: {
        type: 'integer',
        default: 0,
      },
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual(0)
  })

  it('returns schema default value when default is empty string', () => {
    const param = {
      name: 'search',
      in: 'query',
      examples: {},
      schema: {
        type: 'string',
        default: '',
      },
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual('')
  })

  it('returns schema default value for object type', () => {
    const param = {
      name: 'filter',
      in: 'query',
      examples: {},
      schema: {
        type: 'object',
        default: { status: 'active', limit: 20 },
      },
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual({ status: 'active', limit: 20 })
  })

  it('returns undefined when schema has no default and no matching example', () => {
    const param = {
      name: 'page',
      in: 'query',
      examples: {
        first: { value: 1 },
      },
      schema: {
        type: 'integer',
      },
    } satisfies ParameterObject

    const result = getExample(param, 'nonexistent', undefined)
    expect(result).toBeUndefined()
  })

  it('resolves $ref values when example is a reference', () => {
    const param = {
      name: 'data',
      in: 'query',
      examples: {
        sample: {
          '$ref': '#/components/examples/SampleData',
          '$ref-value': { value: 'resolved-example-data' },
        },
      },
    } satisfies ParameterObject

    const result = getExample(param, 'sample', undefined)
    expect(result?.value).toEqual('resolved-example-data')
  })

  it('returns first value from schema.examples when no other examples exist', () => {
    const param = {
      name: 'status',
      in: 'query',
      schema: {
        type: 'string',
        examples: ['active', 'inactive', 'pending'],
      },
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('active')
  })

  it('returns first value from schema.enum when no other examples exist', () => {
    const param = {
      name: 'priority',
      in: 'query',
      schema: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
      },
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('low')
  })

  it('returns schema.example when no other examples exist', () => {
    const param = {
      name: 'category',
      in: 'query',
      schema: {
        type: 'string',
        example: 'deprecated-example-value',
      },
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('deprecated-example-value')
  })

  it('grabs the content.example', () => {
    const param = {
      content: {
        'application/json': {
          example: 'electronics',
        },
      },
    } satisfies RequestBodyObject

    const result = getExample(param, '', 'application/json')
    expect(result?.value).toEqual('electronics')
  })

  it('prioritizes schema.examples over schema.enum', () => {
    const param = {
      name: 'size',
      in: 'query',
      example: 'large',
    } satisfies ParameterObject

    const result = getExample(param, '', undefined)
    expect(result?.value).toEqual('large')
  })

  it('returns value from examples for array parameter', () => {
    const param = {
      name: 'domains',
      in: 'query',
      required: true,
      examples: {
        list: {
          summary: 'A list of domains',
          value: ['example.com', 'example.org'],
          'x-disabled': false,
        },
      },
      schema: {
        type: 'array',
        title: 'Domains',
        items: {
          type: 'string',
        },
      },
    } satisfies ParameterObject

    const result = getExample(param, 'list', undefined)
    expect(result?.value).toEqual(['example.com', 'example.org'])
  })
})
