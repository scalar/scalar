import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { AsyncApiDocumentSchema } from '@/schemas/v3.0/asyncapi-document'

describe('TypeBox validation', () => {
  describe('AsyncApiDocumentSchema', () => {
    it('validates a minimal AsyncAPI document', () => {
      const EXAMPLE_DOCUMENT = {
        asyncapi: '3.0.0',
        info: {
          title: 'My API',
          version: '1.0.0',
        },
      }

      const isValid = Value.Check(AsyncApiDocumentSchema, EXAMPLE_DOCUMENT)

      expect(isValid).toBe(true)
    })

    it('validates an AsyncAPI document with channels', () => {
      const EXAMPLE_DOCUMENT = {
        asyncapi: '3.0.0',
        info: {
          title: 'User Events API',
          version: '1.0.0',
          description: 'API for user-related events',
        },
        channels: {
          'user/signedup': {
            address: 'user.signedup',
            messages: {
              userSignedUp: {
                payload: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      }

      const isValid = Value.Check(AsyncApiDocumentSchema, EXAMPLE_DOCUMENT)

      expect(isValid).toBe(true)
    })

    it('rejects a document missing required asyncapi field', () => {
      const EXAMPLE_DOCUMENT = {
        info: {
          title: 'My API',
          version: '1.0.0',
        },
      }

      const isValid = Value.Check(AsyncApiDocumentSchema, EXAMPLE_DOCUMENT)

      expect(isValid).toBe(false)
    })

    it('rejects a document missing required info field', () => {
      const EXAMPLE_DOCUMENT = {
        asyncapi: '3.0.0',
      }

      const isValid = Value.Check(AsyncApiDocumentSchema, EXAMPLE_DOCUMENT)

      expect(isValid).toBe(false)
    })

    it('rejects a document with invalid info structure', () => {
      const EXAMPLE_DOCUMENT = {
        asyncapi: '3.0.0',
        info: {
          title: 'My API',
          // missing required version
        },
      }

      const isValid = Value.Check(AsyncApiDocumentSchema, EXAMPLE_DOCUMENT)

      expect(isValid).toBe(false)
    })
  })
})
