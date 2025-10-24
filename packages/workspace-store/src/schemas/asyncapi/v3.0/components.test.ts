import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { ComponentsObjectSchema } from './asyncapi-document'

describe('components', () => {
  it('parses components object with schemas', () => {
    const validInput = {
      schemas: {
        UserMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
        },
      },
    }

    const result = coerceValue(ComponentsObjectSchema, validInput)

    expect(result.schemas?.UserMessage).toBeDefined()
    expect(result.schemas?.UserMessage).toMatchObject({
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
      },
    })
  })
})
