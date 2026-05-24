import type { AsyncApiDocument, AsyncApiOperationObject, AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getAsyncApiSecurityRequirements } from '@/channel-example/get-asyncapi-security-requirements'

const documentWithInlineSecurity = {
  asyncapi: '3.0.0',
  info: { title: 'Inline security', version: '1.0.0' },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
  operations: {
    send: {
      action: 'send',
      channel: { address: 'test' },
      security: [
        {
          type: 'http',
          scheme: 'bearer',
        },
      ],
    },
  },
} as unknown as AsyncApiDocument

describe('getAsyncApiSecurityRequirements', () => {
  it('maps inline security entries to a matching components.securitySchemes name', () => {
    const operation = documentWithInlineSecurity.operations?.send as AsyncApiOperationObject
    const requirements = getAsyncApiSecurityRequirements(documentWithInlineSecurity, operation)

    expect(requirements).toStrictEqual([{ bearerAuth: [] }])
  })

  it('preserves scopes from inline security entries', () => {
    const document = {
      ...documentWithInlineSecurity,
      operations: {
        send: {
          action: 'send',
          channel: { address: 'test' },
          security: [
            {
              type: 'http',
              scheme: 'bearer',
              scopes: ['read:all'],
            },
          ],
        },
      },
    } as unknown as AsyncApiDocument

    const operation = document.operations?.send as AsyncApiOperationObject
    const requirements = getAsyncApiSecurityRequirements(document, operation)

    expect(requirements).toStrictEqual([{ bearerAuth: ['read:all'] }])
  })

  it('resolves security from a $ref to components.securitySchemes', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Ref security', version: '1.0.0' },
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            in: 'user',
            name: 'api-key',
          },
        },
      },
      servers: {
        production: {
          host: 'example.com',
          protocol: 'wss',
          security: [{ $ref: '#/components/securitySchemes/apiKey' }],
        },
      },
    } as unknown as AsyncApiDocument

    const server = document.servers?.production as AsyncApiServerObject
    const requirements = getAsyncApiSecurityRequirements(document, null, server)

    expect(requirements).toStrictEqual([{ apiKey: [] }])
  })
})
