import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type OAuthFlowsObject, OAuthFlowsObjectSchema } from './openapi-document'

describe('oauth-flow', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof OAuthFlowsObjectSchema>>
      type TypescriptType = RequiredDeep<OAuthFlowsObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses valid OAuth implicit flow correctly', () => {
      const validInput = {
        authorizationUrl: 'https://example.com/oauth/authorize',
        refreshUrl: 'https://example.com/oauth/token',
        scopes: {
          read: 'Grants read access',
          write: 'Grants write access',
        },
      }

      const result = coerceValue(OAuthFlowsObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid OAuth password flow correctly', () => {
      const validInput = {
        tokenUrl: 'https://example.com/oauth/token',
        refreshUrl: 'https://example.com/oauth/token',
        scopes: {
          admin: 'Grants admin access',
        },
      }

      const result = coerceValue(OAuthFlowsObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid OAuth client credentials flow correctly', () => {
      const validInput = {
        tokenUrl: 'https://example.com/oauth/token',
        refreshUrl: 'https://example.com/oauth/token',
        scopes: {
          api: 'Grants API access',
        },
      }

      const result = coerceValue(OAuthFlowsObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid OAuth authorization code flow correctly', () => {
      const validInput = {
        authorizationUrl: 'https://example.com/oauth/authorize',
        tokenUrl: 'https://example.com/oauth/token',
        refreshUrl: 'https://example.com/oauth/token',
        scopes: {
          user: 'Grants user access',
          profile: 'Grants profile access',
        },
      }

      const result = coerceValue(OAuthFlowsObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(OAuthFlowsObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when required fields are missing', () => {
      const invalidInput = {
        authorizationCode: {
          scopes: {
            read: 'Grants read access',
          },
        },
        // Missing authorizationUrl and refreshUrl for implicit flow
      }

      // Should fail validation since required fields are missing
      expect(Value.Check(OAuthFlowsObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when scopes is not an object', () => {
      const invalidInput = {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          refreshUrl: 'https://example.com/oauth/token',
          scopes: {
            read: 'Grants read access',
          },
        },
        refreshUrl: 'https://example.com/oauth/token',
        scopes: 'not an object',
      }

      // Should fail validation since scopes must be an object
      expect(Value.Check(OAuthFlowsObjectSchema, invalidInput)).toBe(false)
    })
  })
})
