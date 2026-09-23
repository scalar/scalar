import { coerce, generateTypes } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { generateSchema } from './index'
import { normalRef, recursiveRef } from './reference'

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

  it('keeps the reference branch for a bundled $ref with siblings', () => {
    // Bundled documents carry the resolved target in `$ref-value` next to the `$ref`. The `type`
    // sibling makes the inline Schema Object branch a candidate too, so this pins that the `$ref` and
    // `$ref-value` keys still decide the branch, and that the resolved target comes through intact.
    const animal = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        owner: {
          type: 'object',
          properties: { address: { type: 'object', properties: { city: { type: 'string', enum: ['Paris'] } } } },
        },
      },
    }
    const pet = { $ref: '#/components/schemas/Animal', '$ref-value': animal, type: 'string', description: 'A pet' }
    const input = {
      openapi: '3.1.0',
      info: { title: 'Pets', version: '1.0.0' },
      components: {
        schemas: {
          Animal: animal,
          Pet: pet,
          Pets: { type: 'array', items: { $ref: '#/components/schemas/Pet', '$ref-value': pet } },
        },
      },
    }

    expect(coerce(generateSchema(recursiveRef), input)).toEqual({
      ...input,
      components: {
        schemas: {
          Animal: animal,
          // The reference branch declares no `type`, so the `type: 'string'` sibling is dropped.
          Pet: { $ref: '#/components/schemas/Animal', '$ref-value': animal, description: 'A pet' },
          // `$ref-value` follows the chain of references through to the final target.
          Pets: { type: 'array', items: { $ref: '#/components/schemas/Pet', '$ref-value': animal } },
        },
      },
      'x-scalar-original-document-hash': '',
    })
  })

  it('stops following `$ref-value` at references that point at each other', () => {
    const a: Record<string, unknown> = { $ref: '#/components/schemas/B' }
    const b: Record<string, unknown> = { $ref: '#/components/schemas/A' }
    a['$ref-value'] = b
    b['$ref-value'] = a
    const input = {
      openapi: '3.1.0',
      info: { title: 'Loop', version: '1.0.0' },
      components: { schemas: { A: a, B: b } },
    }

    expect(coerce(generateSchema(recursiveRef), input)).toMatchObject({
      components: {
        schemas: {
          A: { $ref: '#/components/schemas/B' },
          B: { $ref: '#/components/schemas/A' },
        },
      },
    })
  })
})
