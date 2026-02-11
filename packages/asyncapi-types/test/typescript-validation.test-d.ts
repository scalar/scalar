import { describe, expectTypeOf, it } from 'vitest'

import type { AsyncApiDocument } from '@/types/v3.0/asyncapi-document'

describe('TypeScript validation', () => {
  describe('AsyncApiDocument', () => {
    it('validates a minimal AsyncAPI document', () => {
      const EXAMPLE_DOCUMENT = {
        asyncapi: '3.0.0',
        info: {
          title: 'My API',
          version: '1.0.0',
        },
      } satisfies AsyncApiDocument

      expectTypeOf(EXAMPLE_DOCUMENT).toMatchTypeOf<AsyncApiDocument>()
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
      } satisfies AsyncApiDocument

      expectTypeOf(EXAMPLE_DOCUMENT).toMatchTypeOf<AsyncApiDocument>()
    })

    it('rejects a document missing required asyncapi field', () => {
      const EXAMPLE_DOCUMENT = {
        info: {
          title: 'My API',
          version: '1.0.0',
        },
      }

      expectTypeOf(EXAMPLE_DOCUMENT).not.toMatchTypeOf<AsyncApiDocument>()
    })

    it('rejects a document missing required info field', () => {
      const EXAMPLE_DOCUMENT = {
        asyncapi: '3.0.0',
      }

      expectTypeOf(EXAMPLE_DOCUMENT).not.toMatchTypeOf<AsyncApiDocument>()
    })

    it('rejects a document with invalid info structure', () => {
      const EXAMPLE_DOCUMENT = {
        asyncapi: '3.0.0',
        info: {
          title: 'My API',
        },
      }

      expectTypeOf(EXAMPLE_DOCUMENT).not.toMatchTypeOf<AsyncApiDocument>()
    })
  })
})
