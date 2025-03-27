import { describe, expect, it } from 'vitest'

import { ComponentsObjectSchema } from '../unprocessed/components-object'
import { ReferenceObjectSchema } from '../unprocessed/reference-object'

describe('reference-object', () => {
  describe('ReferenceObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#reference-object-example
    it('Reference Object Example', () => {
      const result = ReferenceObjectSchema.parse({
        $ref: '#/components/schemas/Pet',
      })

      expect(result).toEqual({
        $ref: '#/components/schemas/Pet',
      })
    })
  })

  describe('ComponentsObjectSchema', () => {
    it('schemas with $ref', () => {
      const result = ComponentsObjectSchema.parse({
        responses: {
          200: {
            $ref: '#/components/responses/foobar',
          },
        },
        parameters: {
          id: {
            $ref: '#/components/parameters/foobar',
          },
        },
        examples: {
          foobar: {
            $ref: '#/components/examples/foobar',
          },
        },
        requestBodies: {
          foobar: {
            $ref: '#/components/requestBodies/foobar',
          },
        },
        headers: {
          foobar: {
            $ref: '#/components/headers/foobar',
          },
        },
        securitySchemes: {
          foobar: {
            $ref: '#/components/securitySchemes/foobar',
          },
        },
        links: {
          foobar: {
            $ref: '#/components/links/foobar',
          },
        },
        callbacks: {
          foobar: {
            $ref: '#/components/callbacks/foobar',
          },
        },
      })

      expect(result).toEqual({
        responses: {
          200: {
            $ref: '#/components/responses/foobar',
          },
        },
        parameters: {
          id: {
            $ref: '#/components/parameters/foobar',
          },
        },
        examples: {
          foobar: {
            $ref: '#/components/examples/foobar',
          },
        },
        requestBodies: {
          foobar: {
            $ref: '#/components/requestBodies/foobar',
          },
        },
        headers: {
          foobar: {
            $ref: '#/components/headers/foobar',
          },
        },
        securitySchemes: {
          foobar: {
            $ref: '#/components/securitySchemes/foobar',
          },
        },
        links: {
          foobar: {
            $ref: '#/components/links/foobar',
          },
        },
        callbacks: {
          foobar: {
            $ref: '#/components/callbacks/foobar',
          },
        },
      })
    })
  })
})
