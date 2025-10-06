import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getParameterExample } from '@/v2/blocks/scalar-operation-block/helpers/get-parameter-example'

describe('getParameterExample', () => {
  it('extract example from parameter #1', () => {
    const exampleKey = 'example1'
    const parameter: ParameterObject = {
      in: 'path',
      name: 'some name',
      examples: {
        [exampleKey]: {
          value: 'some value',
        },
      },
    }

    expect(getParameterExample(parameter, exampleKey)).toEqual({
      value: 'some value',
    })
  })

  it('extract example from parameter #2', () => {
    const exampleKey = 'example1'
    const parameter: ParameterObject = {
      in: 'path',
      name: 'some name',
      examples: {
        'example2': {
          value: 'example 2 value',
        },
        [exampleKey]: {
          value: 'some value',
        },
      },
    }

    expect(getParameterExample(parameter, exampleKey)).toEqual({
      value: 'some value',
    })
  })

  it('extract example from parameter #3', () => {
    const exampleKey = 'example1'
    const parameter: ParameterObject = {
      in: 'path',
      name: 'some name',
      content: {
        'application/json': {
          examples: {
            'example2': {
              value: 'example 2 value',
            },
            [exampleKey]: {
              value: 'some value',
            },
          },
        },
      },
    }

    expect(getParameterExample(parameter, exampleKey)).toEqual({
      value: 'some value',
    })
  })
})
