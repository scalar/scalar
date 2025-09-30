import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type InfoObject, InfoObjectSchema } from './openapi-document'

describe('info', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof InfoObjectSchema>>
      type TypescriptType = RequiredDeep<InfoObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid info object correctly', () => {
      const validInput = {
        title: 'Sample Pet Store App',
        version: '1.0.1',
        summary: 'A pet store manager.',
        description: 'This is a sample server for a pet store.',
        termsOfService: 'https://example.com/terms/',
        contact: {
          name: 'API Support',
          url: 'https://www.example.com/support',
          email: 'support@example.com',
        },
        license: {
          name: 'Apache 2.0',
          url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
      }

      const result = coerceValue(InfoObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        title: 'Sample Pet Store App',
        version: '1.0.1',
        summary: 'A pet store manager.',
        description: 'This is a sample server for a pet store.',
        termsOfService: 'https://example.com/terms/',
        contact: {
          name: 'API Support',
          url: 'https://www.example.com/support',
          email: 'support@example.com',
        },
        license: {
          name: 'Apache 2.0',
          url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
      })
    })

    it('handles info object with only required fields', () => {
      const validInput = {
        title: 'My API',
        version: '1.0.0',
      }

      const result = coerceValue(InfoObjectSchema, validInput)

      // Should work with only the required fields
      expect(result).toEqual({
        title: 'My API',
        version: '1.0.0',
      })
    })

    it('handles info object with x-scalar-sdk-installation extension', () => {
      const validInput = {
        title: 'My API',
        version: '1.0.0',
        'x-scalar-sdk-installation': [
          {
            lang: 'npm',
            source: 'npm install my-api-sdk',
            description: 'Install my-api-sdk',
          },
          {
            lang: 'yarn',
            source: 'yarn add my-api-sdk',
            description: 'Install my-api-sdk',
          },
        ],
      }

      const result = coerceValue(InfoObjectSchema, validInput)

      // Should preserve extension fields
      expect(result).toEqual({
        title: 'My API',
        version: '1.0.0',
        'x-scalar-sdk-installation': [
          {
            lang: 'npm',
            source: 'npm install my-api-sdk',
            description: 'Install my-api-sdk',
          },
          {
            lang: 'yarn',
            source: 'yarn add my-api-sdk',
            description: 'Install my-api-sdk',
          },
        ],
      })
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(InfoObjectSchema, invalidInput)).toBe(false)
    })
  })
})
