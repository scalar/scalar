import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type AsyncApiDocument, AsyncApiDocumentSchema } from './asyncapi-document'

describe('asyncapi-document', () => {
  describe('strict type checking', () => {
    it('matches the TypeScript type to the schema', () => {
      type SchemaType = RequiredDeep<Static<typeof AsyncApiDocumentSchema>>
      type TypescriptType = RequiredDeep<AsyncApiDocument>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses a minimal valid document', () => {
      const validInput = {
        asyncapi: '3.0.0',
        info: {
          title: 'Streetlights API',
          version: '1.0.0',
        },
      }

      const result = coerceValue(AsyncApiDocumentSchema, validInput)

      expect(result).toEqual(validInput)
    })

    it('parses a document with an info description', () => {
      const validInput = {
        asyncapi: '3.0.0',
        info: {
          title: 'Streetlights API',
          version: '1.0.0',
          description: 'Turn the lights on and off.',
        },
      }

      const result = coerceValue(AsyncApiDocumentSchema, validInput)

      expect(result).toEqual(validInput)
    })

    it('rejects a document missing the asyncapi field', () => {
      const invalidInput = {
        info: { title: 'x', version: '1' },
      }

      expect(Value.Check(AsyncApiDocumentSchema, invalidInput)).toBe(false)
    })

    it('rejects a document missing required info fields', () => {
      const invalidInput = {
        asyncapi: '3.0.0',
        info: { title: 'x' },
      }

      expect(Value.Check(AsyncApiDocumentSchema, invalidInput)).toBe(false)
    })
  })
})
