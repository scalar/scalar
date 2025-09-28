import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getParameterSchema } from '@/v2/blocks/scalar-operation-block/helpers/get-parameter-schema'

describe('getParameterSchema', () => {
  it('return undefined when the schema does not exists', () => {
    const parameter: ParameterObject = {
      in: 'path',
      name: 'some name',
    }

    expect(getParameterSchema(parameter)).toBe(undefined)
  })

  it('extract schema from parameter #1', () => {
    const parameter: ParameterObject = {
      in: 'path',
      name: 'some name',
      schema: {
        type: 'string',
      },
    }

    expect(getParameterSchema(parameter)).toEqual({
      type: 'string',
    })
  })

  it('extract example from parameter #2', () => {
    const parameter: ParameterObject = {
      in: 'path',
      name: 'some name',
      content: {
        'text/plain': {
          schema: {
            type: 'string',
          },
        },
      },
    }

    expect(getParameterSchema(parameter)).toEqual({
      type: 'string',
    })
  })
})
