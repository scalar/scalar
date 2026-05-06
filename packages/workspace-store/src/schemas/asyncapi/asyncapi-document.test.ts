import { type Static, coerce, validate } from '@scalar/validation'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { AsyncApiDocument } from './asyncapi-document'

describe('asyncapi-document', () => {
  describe('strict type checking', () => {
    it('matches the TypeScript type to the schema', () => {
      type SchemaType = RequiredDeep<Static<typeof AsyncApiDocument>>
      type TypescriptType = RequiredDeep<import('./asyncapi-document').AsyncApiDocument>

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
        // Workspace-store-managed metadata shared with OpenAPI documents.
        // The hash is required at the schema level even though AsyncAPI does
        // not yet exercise hash-based change detection.
        'x-scalar-original-document-hash': '',
      }

      const result = coerce(AsyncApiDocument, validInput)

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
        'x-scalar-original-document-hash': '',
      }

      const result = coerce(AsyncApiDocument, validInput)

      expect(result).toEqual(validInput)
    })

    it('rejects a document missing the asyncapi field', () => {
      const invalidInput = {
        info: { title: 'x', version: '1' },
      }

      expect(validate(AsyncApiDocument, invalidInput)).toBe(false)
    })

    it('rejects a document missing required info fields', () => {
      const invalidInput = {
        asyncapi: '3.0.0',
        info: { title: 'x' },
      }

      expect(validate(AsyncApiDocument, invalidInput)).toBe(false)
    })
  })
})
