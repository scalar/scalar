import type { AsyncApiDocument, AsyncApiOperationObject, AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import {
  getAsyncApiDocumentSecurityRequirements,
  getAsyncApiSecurityRequirements,
} from '@/channel-example/get-asyncapi-security-requirements'

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

  it('decodes JSON Pointer escapes in security scheme $refs', () => {
    // Scheme name contains both `/` (escaped as `~1`) and `~` (escaped as `~0`).
    const schemeName = 'tenant/admin~v2'
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Pointer escapes', version: '1.0.0' },
      components: {
        securitySchemes: {
          [schemeName]: {
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
          security: [{ $ref: '#/components/securitySchemes/tenant~1admin~0v2' }],
        },
      },
    } as unknown as AsyncApiDocument

    const server = document.servers?.production as AsyncApiServerObject
    const requirements = getAsyncApiSecurityRequirements(document, null, server)

    expect(requirements).toStrictEqual([{ [schemeName]: [] }])
  })

  it('ignores security $refs outside of components.securitySchemes', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Invalid ref', version: '1.0.0' },
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
          security: [{ $ref: '#/components/securitySchemes/apiKey/scheme' }],
        },
      },
    } as unknown as AsyncApiDocument

    const server = document.servers?.production as AsyncApiServerObject

    expect(getAsyncApiSecurityRequirements(document, null, server)).toStrictEqual([])
  })
})

describe('getAsyncApiDocumentSecurityRequirements', () => {
  it('unions security requirements across all servers', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Multi server', version: '1.0.0' },
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user', name: 'api-key' },
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
      servers: {
        production: {
          host: 'example.com',
          protocol: 'wss',
          security: [{ $ref: '#/components/securitySchemes/apiKey' }],
        },
        staging: {
          host: 'staging.example.com',
          protocol: 'wss',
          security: [{ $ref: '#/components/securitySchemes/bearerAuth' }],
        },
      },
    } as unknown as AsyncApiDocument

    expect(getAsyncApiDocumentSecurityRequirements(document)).toStrictEqual([{ apiKey: [] }, { bearerAuth: [] }])
  })

  it('dedupes identical requirements shared by multiple servers', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Shared scheme', version: '1.0.0' },
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user', name: 'api-key' },
        },
      },
      servers: {
        production: {
          host: 'example.com',
          protocol: 'wss',
          security: [{ $ref: '#/components/securitySchemes/apiKey' }],
        },
        staging: {
          host: 'staging.example.com',
          protocol: 'wss',
          security: [{ $ref: '#/components/securitySchemes/apiKey' }],
        },
      },
    } as unknown as AsyncApiDocument

    expect(getAsyncApiDocumentSecurityRequirements(document)).toStrictEqual([{ apiKey: [] }])
  })

  it('adds an optional no-auth requirement when some servers require auth and others do not', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Mixed auth', version: '1.0.0' },
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user', name: 'api-key' },
        },
      },
      servers: {
        secured: {
          host: 'example.com',
          protocol: 'wss',
          security: [{ $ref: '#/components/securitySchemes/apiKey' }],
        },
        open: {
          host: 'open.example.com',
          protocol: 'wss',
        },
      },
    } as unknown as AsyncApiDocument

    // The unauthenticated server surfaces as an optional `{}` so it stays selectable.
    expect(getAsyncApiDocumentSecurityRequirements(document)).toStrictEqual([{ apiKey: [] }, {}])
  })

  it('does not add a no-auth requirement for a server whose declared security fails to resolve', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Unresolvable security', version: '1.0.0' },
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user', name: 'api-key' },
        },
      },
      servers: {
        secured: {
          host: 'example.com',
          protocol: 'wss',
          security: [{ $ref: '#/components/securitySchemes/apiKey' }],
        },
        // Declares security, but the inline scheme matches no component definition, so it resolves
        // to nothing. This server still requires auth — it must not be treated as unauthenticated.
        broker: {
          host: 'broker.example.com',
          protocol: 'kafka',
          security: [{ type: 'scramSha256' }],
        },
      },
    } as unknown as AsyncApiDocument

    expect(getAsyncApiDocumentSecurityRequirements(document)).toStrictEqual([{ apiKey: [] }])
  })

  it('returns an empty array when no servers declare security', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'No security', version: '1.0.0' },
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user', name: 'api-key' },
        },
      },
      servers: {
        production: { host: 'example.com', protocol: 'wss' },
      },
    } as unknown as AsyncApiDocument

    expect(getAsyncApiDocumentSecurityRequirements(document)).toStrictEqual([])
  })

  it('returns an empty array when the document has no servers', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'No servers', version: '1.0.0' },
    } as unknown as AsyncApiDocument

    expect(getAsyncApiDocumentSecurityRequirements(document)).toStrictEqual([])
  })
})
