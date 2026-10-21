import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { bench, describe } from 'vitest'

import Schema from './Schema.vue'

/** A large API description with shared schemas and no dynamic references. */
const createDocument = (resources: boolean): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title: 'Proxy benchmark', version: '1.0.0' },
  paths: Object.fromEntries(
    Array.from({ length: 2000 }, (_, index) => [
      `/items/${index}`,
      {
        get: {
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: `#/components/schemas/Item${index % 200}` } },
              },
            },
          },
        },
      },
    ]),
  ),
  components: {
    schemas: Object.fromEntries(
      Array.from({ length: 200 }, (_, index) => [
        `Item${index}`,
        {
          ...(resources ? { $id: `urn:item:${index}`, $defs: { unused: { type: 'string' } } } : {}),
          type: 'object',
          properties: Object.fromEntries(
            Array.from({ length: 20 }, (_, property) => [
              `field${property}`,
              { type: 'string', description: `Field ${property}` },
            ]),
          ),
        },
      ]),
    ),
  },
})

/**
 * Read each response schema as a renderer would, including reference resolution.
 * This measures data access only, not Vue mounting, browser layout, or paint.
 */
const readSchemas = (document: Record<string, unknown>): void => {
  const paths = document.paths as Record<
    string,
    {
      get: {
        responses: Record<
          string,
          {
            content: Record<string, { schema: object }>
          }
        >
      }
    }
  >
  for (const path of Object.values(paths)) {
    const schema = Reflect.get(path.get.responses['200']!.content['application/json']!.schema, '$ref-value')
    for (const property of Object.values(schema.properties as Record<string, { type: string }>)) {
      if (property.type !== 'string') {
        throw new Error('Unexpected property type')
      }
    }
  }
}

describe('magic proxy without dynamic references: 2000 operations, 200 schemas, 20 fields', () => {
  for (const resources of [false, true]) {
    const document = createDocument(resources)
    const warm = createMagicProxy(document)
    readSchemas(warm)
    const schemas = (warm.components as { schemas: Record<string, SchemaObject> }).schemas
    const label = resources ? 'with $id and $defs' : 'without resource keywords'

    bench(
      `${label}: ingest into workspace store`,
      async () => {
        const store = createWorkspaceStore()
        await store.addDocument({ name: 'benchmark', document: structuredClone(document) })
      },
      { time: 2000, iterations: 20 },
    )

    bench(
      `${label}: mount one 20-field response schema`,
      () => {
        mount(Schema, {
          props: {
            schema: schemas.Item0,
            options: { expandAllSchemaProperties: true },
            eventBus: null,
          },
        }).unmount()
      },
      { time: 2000, iterations: 50 },
    )

    bench(
      `${label}: create proxy and index references`,
      () => {
        createMagicProxy(document)
      },
      { time: 2000, iterations: 50 },
    )

    bench(
      `${label}: create proxy and read every response schema`,
      () => {
        readSchemas(createMagicProxy(document))
      },
      { time: 2000, iterations: 50 },
    )

    bench(
      `${label}: read cached response schemas`,
      () => {
        readSchemas(warm)
      },
      { time: 2000, iterations: 50 },
    )
  }
})
