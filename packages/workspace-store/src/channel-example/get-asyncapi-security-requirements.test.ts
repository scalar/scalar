import type { AsyncApiDocument, AsyncApiOperationObject, AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import {
  getAsyncApiDocumentSecurityRequirements,
  getAsyncApiSecurityRequirements,
  getAsyncApiSecuritySchemes,
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
  it('registers inline server and operation schemes without changing the description', () => {
    const server = { host: 'example.com', protocol: 'wss', security: [{ type: 'http', scheme: 'bearer' }] }
    const operation = {
      action: 'send',
      channel: { $ref: '#/channels/events' },
      security: [{ type: 'oauth2', flows: {}, scopes: ['events:read'] }],
    }
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Inline', version: '1' },
      servers: { production: server },
      operations: { events: operation },
    } as unknown as AsyncApiDocument
    const original = JSON.stringify(document)
    expect(getAsyncApiSecuritySchemes(document)).toStrictEqual({
      'Server production · http 1': server.security[0],
      'Operation events · oauth2 1': operation.security[0],
    })
    expect(getAsyncApiSecurityRequirements(document, operation as AsyncApiOperationObject)).toStrictEqual([
      { 'Operation events · oauth2 1': ['events:read'] },
    ])
    expect(getAsyncApiDocumentSecurityRequirements(document)).toStrictEqual([{ 'Server production · http 1': [] }])
    expect(getAsyncApiSecuritySchemes(document, false)).toStrictEqual({
      'Server production · http 1': server.security[0],
    })
    expect(JSON.stringify(document)).toBe(original)
  })

  it('keeps identical inline declarations at different locations separate and avoids component name collisions', () => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Inline', version: '1' },
      components: {
        securitySchemes: {
          'Server a · http 1': { type: 'http', scheme: 'basic' },
          'Server a · http 1 (inline)': { type: 'http', scheme: 'digest' },
        },
      },
      servers: {
        a: { host: 'a.example.com', protocol: 'wss', security: [{ type: 'http', scheme: 'bearer' }] },
        b: { host: 'b.example.com', protocol: 'wss', security: [{ type: 'http', scheme: 'bearer' }] },
      },
    } as unknown as AsyncApiDocument
    expect(getAsyncApiDocumentSecurityRequirements(document)).toStrictEqual([
      { 'Server a · http 1 (inline) (inline)': [] },
      { 'Server b · http 1': [] },
    ])
  })

  it('matches component definitions with scopes without replacing declaration scopes', () => {
    const operation = {
      action: 'send',
      channel: { $ref: '#/channels/events' },
      security: [{ type: 'oauth2', flows: {}, scopes: ['read'] }],
    } as AsyncApiOperationObject
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Scopes', version: '1' },
      components: { securitySchemes: { oauth: { type: 'oauth2', flows: {}, scopes: ['write'] } } },
      operations: { events: operation },
    } as unknown as AsyncApiDocument
    expect(getAsyncApiSecurityRequirements(document, operation)).toStrictEqual([{ oauth: ['read'] }])
    expect(Object.keys(getAsyncApiSecuritySchemes(document))).toStrictEqual(['oauth'])
  })

  it('requires server security together with one operation alternative', () => {
    const server = { host: 'example.com', protocol: 'wss', security: [{ type: 'http', scheme: 'bearer' }] }
    const operation = {
      action: 'send',
      channel: { $ref: '#/channels/events' },
      security: [
        { type: 'oauth2', flows: {}, scopes: ['read'] },
        { type: 'httpApiKey', in: 'header', name: 'X-Key' },
      ],
    }
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Layers', version: '1' },
      servers: { main: server },
      operations: { events: operation },
    } as unknown as AsyncApiDocument
    expect(
      getAsyncApiSecurityRequirements(document, operation as AsyncApiOperationObject, server as AsyncApiServerObject),
    ).toStrictEqual([
      { 'Server main · http 1': [], 'Operation events · oauth2 1': ['read'] },
      { 'Server main · http 1': [], 'Operation events · httpApiKey 2': [] },
    ])
  })

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
        // Declares security, but the reference cannot resolve. This server still requires auth — it must not be treated as unauthenticated.
        broker: {
          host: 'broker.example.com',
          protocol: 'kafka',
          security: [{ $ref: '#/missing' }],
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
