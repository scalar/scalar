import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { schema } from './schema'

describe('schema', () => {
  it('preserves nullable array type when items are present', () => {
    const value = {
      type: ['array', 'null'],
      items: {
        $ref: '#/components/schemas/ArtifactResponse',
      },
    }

    expect(coerce(schema, value)).toEqual(value)
  })

  it('preserves nested nullable schemas with validation keywords', () => {
    const value = {
      type: ['array', 'null'],
      items: {
        type: ['object', 'null'],
        properties: {
          name: {
            type: ['string', 'null'],
            maxLength: 100,
          },
        },
      },
    }

    expect(coerce(schema, value)).toEqual(value)
  })

  it('infers object type for schemas with properties and no explicit type', () => {
    const value = {
      properties: {
        name: {
          type: 'string',
        },
      },
    }

    expect(coerce(schema, value)).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    })
  })
})
