import { getActiveOpenApiDocument } from '@test/helpers'
import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'

const files: Record<string, string> = {
  // A complete OpenAPI 3.0 document, as in "schemas/Item.yaml#/components/schemas/Item".
  'https://example.test/schemas/Item.json': JSON.stringify({
    openapi: '3.0.3',
    info: { title: 't', version: '1' },
    components: {
      schemas: { Item: { type: 'object', properties: { name: { type: 'string', nullable: true } } } },
    },
  }),
  // A file that only holds a schema, without any version information.
  'https://example.test/schemas/Bare.json': JSON.stringify({
    type: 'object',
    properties: { name: { type: 'string', nullable: true } },
  }),
}

const fetchFile = (input: string | URL | Request) => {
  const body = files[String(input)]
  return Promise.resolve(body === undefined ? new Response('', { status: 404 }) : new Response(body))
}

const getNameSchema = async (version: string, ref: string) => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'default',
    fetch: fetchFile,
    document: {
      openapi: version,
      info: { title: 't', version: '1' },
      paths: {
        '/items': {
          get: {
            responses: { '200': { description: 'ok', content: { 'application/json': { schema: { $ref: ref } } } } },
          },
        },
      },
    },
  })

  const document = getActiveOpenApiDocument(store)
  const pathItem = getResolvedRef(document?.paths?.['/items'])
  const operation = getResolvedRef(pathItem?.get)
  const response = getResolvedRef(operation?.responses?.['200'])
  const schema = getResolvedRef(response?.content?.['application/json']?.schema) as
    | { properties?: { name?: Record<string, unknown> } }
    | undefined
  return schema?.properties?.name
}

describe('documents reached through $ref', () => {
  it('upgrades a complete OpenAPI 3.0 document next to an OpenAPI 3.0 entry document', async () => {
    const name = await getNameSchema('3.0.3', 'https://example.test/schemas/Item.json#/components/schemas/Item')

    expect(name).toMatchObject({ type: ['string', 'null'] })
    expect(name).not.toHaveProperty('nullable')
  })

  it('upgrades a complete OpenAPI 3.0 document next to an OpenAPI 3.1 entry document', async () => {
    const name = await getNameSchema('3.1.0', 'https://example.test/schemas/Item.json#/components/schemas/Item')

    expect(name).toMatchObject({ type: ['string', 'null'] })
  })

  it('upgrades a bare schema file referenced from an OpenAPI 3.0 entry document', async () => {
    const name = await getNameSchema('3.0.3', 'https://example.test/schemas/Bare.json')

    expect(name).toMatchObject({ type: ['string', 'null'] })
    expect(name).not.toHaveProperty('nullable')
  })
})
