import { describe, expect, it } from 'vitest'

import { OpenApiObjectSchema } from '../unprocessed/openapi-object'
import { SecurityRequirementObjectSchema } from '../unprocessed/security-requirement-object'

describe('security-requirement-object', () => {
  describe('SecurityRequirementObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#contact-object-example
    describe('Security Requirement Object Examples', () => {
      it('Non-OAuth2 Security Requirement', () => {
        const result = SecurityRequirementObjectSchema.parse({
          api_key: [],
        })

        expect(result).toEqual({
          api_key: [],
        })
      })

      it('OAuth2 Security Requirement', () => {
        const result = SecurityRequirementObjectSchema.parse({
          petstore_auth: ['write:pets', 'read:pets'],
        })

        expect(result).toEqual({
          petstore_auth: ['write:pets', 'read:pets'],
        })
      })

      it('Optional OAuth2 Security', () => {
        const result = OpenApiObjectSchema.parse({
          openapi: '3.1.1',
          info: {
            title: 'Example',
            version: '1.0.0',
          },
          security: [
            {},
            {
              petstore_auth: ['write:pets', 'read:pets'],
            },
          ],
        })

        expect(result).toEqual({
          openapi: '3.1.1',
          info: {
            title: 'Example',
            version: '1.0.0',
          },
          security: [
            {},
            {
              petstore_auth: ['write:pets', 'read:pets'],
            },
          ],
        })
      })
    })
  })
})
