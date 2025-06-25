import { describe, expect, it } from 'vitest'

import { ComponentsObjectSchema } from '../unprocessed/components-object'
import { EncodingObjectSchema } from '../unprocessed/encoding-object'
import { HeaderObjectSchema } from '../unprocessed/header-object'
import { MediaTypeObjectSchema } from '../unprocessed/media-type-object'
import { OperationObjectSchema } from '../unprocessed/operation-object'
import { ParameterObjectSchema } from '../unprocessed/parameter-object'
import { PathItemObjectSchema } from '../unprocessed/path-item-object'
import { ReferenceObjectSchema } from '../unprocessed/reference-object'
import { ResponseObjectSchema } from '../unprocessed/response-object'
import { ResponsesObjectSchema } from '../unprocessed/responses-object'

// For these tests, I've gone through the OpenAPI Specification and found places where the “Reference Object” is used.

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

  describe('PathItemObjectSchema', () => {
    it('path item object with $ref', () => {
      const result = PathItemObjectSchema.parse({
        $ref: '#/components/pathItems/foobar',
      })

      expect(result).toEqual({
        $ref: '#/components/pathItems/foobar',
      })
    })

    it('parameters with $ref', () => {
      const result = PathItemObjectSchema.parse({
        parameters: [
          {
            $ref: '#/components/parameters/foobar',
          },
        ],
      })

      expect(result).toEqual({
        parameters: [
          {
            $ref: '#/components/parameters/foobar',
          },
        ],
      })
    })
  })

  describe('OperationObjectSchema', () => {
    it('operation object with $ref', () => {
      const result = OperationObjectSchema.parse({
        parameters: [
          {
            $ref: '#/components/parameters/foobar',
          },
        ],
        requestBody: {
          $ref: '#/components/requestBodies/foobar',
        },
        callbacks: {
          foobar: {
            $ref: '#/components/callbacks/foobar',
          },
        },
      })

      expect(result).toEqual({
        parameters: [{ $ref: '#/components/parameters/foobar' }],
        requestBody: {
          $ref: '#/components/requestBodies/foobar',
        },
        callbacks: {
          foobar: {
            $ref: '#/components/callbacks/foobar',
          },
        },
      })
    })
  })

  describe('ParameterObjectSchema', () => {
    it('parameter object with $ref', () => {
      const result = ParameterObjectSchema.parse({
        name: 'foobar',
        in: 'query',
        examples: {
          foobar: {
            $ref: '#/components/examples/foobar',
          },
        },
      })

      expect(result).toEqual({
        name: 'foobar',
        in: 'query',
        examples: {
          foobar: {
            $ref: '#/components/examples/foobar',
          },
        },
      })
    })
  })

  describe('MediaTypeObjectSchema', () => {
    it('media type object with $ref', () => {
      const result = MediaTypeObjectSchema.parse({
        examples: {
          foobar: {
            $ref: '#/components/examples/foobar',
          },
        },
      })

      expect(result).toEqual({
        examples: {
          foobar: { $ref: '#/components/examples/foobar' },
        },
      })
    })
  })

  describe('EncodingObjectSchema', () => {
    it('encoding object with $ref', () => {
      const result = EncodingObjectSchema.parse({
        contentType: 'application/json',
        headers: {
          foobar: {
            $ref: '#/components/headers/foobar',
          },
        },
      })

      expect(result).toEqual({
        contentType: 'application/json',
        headers: {
          foobar: {
            $ref: '#/components/headers/foobar',
          },
        },
      })
    })
  })

  describe('ResponsesObjectSchema', () => {
    it('responses object with $ref', () => {
      const result = ResponsesObjectSchema.parse({
        200: {
          $ref: '#/components/responses/foobar',
        },
      })

      expect(result).toEqual({
        200: {
          $ref: '#/components/responses/foobar',
        },
      })
    })
  })

  describe('ResponseObjectSchema', () => {
    it('response object with $ref', () => {
      const result = ResponseObjectSchema.parse({
        description: 'foobar',
        headers: {
          foobar: {
            $ref: '#/components/headers/foobar',
          },
        },
        links: {
          foobar: {
            $ref: '#/components/links/foobar',
          },
        },
      })

      expect(result).toEqual({
        description: 'foobar',
        headers: {
          foobar: { $ref: '#/components/headers/foobar' },
        },
        links: {
          foobar: { $ref: '#/components/links/foobar' },
        },
      })
    })
  })

  describe('HeaderObjectSchema', () => {
    it('header object with $ref', () => {
      const result = HeaderObjectSchema.parse({
        examples: {
          foobar: {
            $ref: '#/components/examples/foobar',
          },
        },
      })

      expect(result).toEqual({
        examples: {
          foobar: { $ref: '#/components/examples/foobar' },
        },
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
