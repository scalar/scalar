import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getParameterContentValue } from '@/v2/blocks/scalar-operation-block/helpers/get-parameter-content'

describe('getParameterContentValue', () => {
  it('returns undefined when there is no content key', () => {
    const parameter: ParameterObject = {
      in: 'header',
      name: 'some name',
    }
    const result = getParameterContentValue(parameter)
    expect(result).toBe(undefined)
  })

  it('returns undefined when there is no there is no content key', () => {
    const parameter: ParameterObject = {
      in: 'header',
      name: 'some name',
      content: {},
    }
    const result = getParameterContentValue(parameter)
    expect(result).toBe(undefined)
  })

  it('returns undefined when there are multiple content key', () => {
    const parameter: ParameterObject = {
      in: 'header',
      name: 'some name',
      content: {
        'application/json': {
          examples: {
            'exampleKey': {
              value: 'some value',
            },
          },
        },
        'plain/text': {
          examples: {
            'example1': {
              value: 'example 1 value',
            },
          },
        },
      },
    }
    const result = getParameterContentValue(parameter)
    expect(result).toBe(undefined)
  })

  it('the content when there is a content', () => {
    const parameter: ParameterObject = {
      in: 'header',
      name: 'some name',
      content: {
        'application/json': {
          examples: {
            'exampleKey': {
              value: 'some value',
            },
          },
        },
      },
    }
    const result = getParameterContentValue(parameter)
    expect(result).toEqual({
      examples: {
        'exampleKey': {
          value: 'some value',
        },
      },
    })
  })
})
