import { coerce, generateTypes } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { generateSchema } from './index'
import { normalRef } from './reference'

describe('index', () => {
  const schema = generateSchema(normalRef)
  const mediaType = {
    description: 'A stream of users',
    itemSchema: { type: 'string' },
    examples: { user: { dataValue: 'Ada', serializedValue: '"Ada"' } },
    encoding: {
      user: {
        style: 'form',
        explode: true,
        allowReserved: false,
        encoding: { name: { contentType: 'text/plain' } },
        prefixEncoding: [{ contentType: 'application/json' }],
        itemEncoding: { contentType: 'text/plain' },
      },
    },
    prefixEncoding: [{ contentType: 'application/json' }],
    itemEncoding: { contentType: 'text/plain' },
  }
  const document = {
    openapi: '3.2.0',
    $self: 'https://example.com/openapi.json',
    info: { title: 'Users', version: '1.0.0' },
    servers: [{ url: 'https://example.com', name: 'Production' }],
    tags: [{ name: 'users', summary: 'Users', parent: 'accounts', kind: 'nav' }],
    paths: {
      '/users': {
        query: {
          parameters: [
            { name: 'filter', in: 'querystring', content: { 'application/json': { schema: { type: 'string' } } } },
          ],
          responses: { '200': { summary: 'User stream', content: { 'application/jsonl': mediaType } } },
        },
        additionalOperations: { COPY: { responses: { '204': { summary: 'Copied' } } } },
      },
    },
    components: {
      mediaTypes: { UserStream: mediaType },
      schemas: {
        User: {
          type: 'object',
          discriminator: { propertyName: 'kind', defaultMapping: 'User' },
          xml: { nodeType: 'element' },
        },
      },
      securitySchemes: {
        oauth: {
          type: 'oauth2',
          deprecated: true,
          oauth2MetadataUrl: 'https://example.com/.well-known/oauth-authorization-server',
          flows: {
            deviceAuthorization: {
              deviceAuthorizationUrl: 'https://example.com/device',
              tokenUrl: 'https://example.com/token',
              refreshUrl: 'https://example.com/refresh',
              scopes: {},
            },
          },
        },
      },
    },
  }

  it('preserves OpenAPI 3.2 fields when coercing a document', () => {
    expect(coerce(schema, document)).toEqual({ ...document, 'x-scalar-original-document-hash': '' })
  })

  it('includes OpenAPI 3.2 fields in generated types', () => {
    const types = generateTypes(schema, { maxDepth: Number.POSITIVE_INFINITY })
    for (const field of ['itemSchema', 'deviceAuthorization', 'additionalOperations', 'querystring', 'nodeType']) {
      expect(types).toContain(field)
    }
  })

  it('preserves references to reusable media types', () => {
    const reference = { $ref: '#/components/mediaTypes/UserStream' }
    const input = {
      openapi: '3.2.0',
      info: document.info,
      components: { mediaTypes: { UserStream: mediaType, Alias: reference } },
      paths: { '/users': { get: { responses: { '200': { content: { 'application/jsonl': reference } } } } } },
    }

    expect(coerce(schema, input)).toEqual({ ...input, 'x-scalar-original-document-hash': '' })
  })
})
