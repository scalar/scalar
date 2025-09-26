import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getExampleValue } from './get-example-value'

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

    const result = getExampleValue(param, 'b')
    expect(result).toEqual(456)
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

    const result = getExampleValue(param)
    expect(result).toEqual('foo')
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

    const result = getExampleValue(param, 'sample', 'application/json')
    expect(result).toEqual({ ok: true })
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

    const result = getExampleValue(param)
    expect(result).toEqual('hello')
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

    const result = getExampleValue(param, undefined, 'application/json')
    expect(result).toEqual({ id: 1 })
  })

  it('returns deprecated param.example when present and no others match', () => {
    const param = {
      name: 'q',
      in: 'query',
      example: 'fallback',
    } satisfies ParameterObject

    const result = getExampleValue(param)
    expect(result).toEqual('fallback')
  })

  it('returns undefined when no examples or example fields exist', () => {
    const param = {
      name: 'q',
      in: 'query',
    } satisfies ParameterObject

    const result = getExampleValue(param)
    expect(result).toBeUndefined()
  })

  it('falls back to content when wrong example key is provided at param level', () => {
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

    const result = getExampleValue(param, 'missing', 'application/json')
    expect(result).toEqual('nope')
  })
})
