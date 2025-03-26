import { describe, expect, it } from 'vitest'

import { CallbackObjectSchema } from '../unprocessed/callback-object'

describe('callback-object', () => {
  describe('CallbackObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#callback-object-example
    describe('Callback Object Example', () => {
      it('The following example uses the user provided queryUrl query string parameter to define the callback URL.', () => {
        const result = CallbackObjectSchema.parse({
          '{$request.query.queryUrl}': {
            post: {
              requestBody: {
                description: 'Callback payload',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SomePayload',
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'callback successfully processed',
                },
              },
            },
          },
        })

        expect(result).toEqual({
          '{$request.query.queryUrl}': {
            post: {
              requestBody: {
                description: 'Callback payload',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SomePayload',
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'callback successfully processed',
                },
              },
            },
          },
        })
      })

      it('The following example shows a callback where the server is hard-coded, but the query string parameters are populated from the id and email property in the request body.', () => {
        const result = CallbackObjectSchema.parse({
          'http://notificationServer.com?transactionId={$request.body#/id}&email={$request.body#/email}': {
            post: {
              requestBody: {
                description: 'Callback payload',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SomePayload',
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'callback successfully processed',
                },
              },
            },
          },
        })

        expect(result).toEqual({
          'http://notificationServer.com?transactionId={$request.body#/id}&email={$request.body#/email}': {
            post: {
              requestBody: {
                description: 'Callback payload',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SomePayload',
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'callback successfully processed',
                },
              },
            },
          },
        })
      })
    })
  })
})
