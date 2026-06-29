import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { isOpenApiDocument } from '@/schemas/type-guards'

/**
 * Regression test for https://github.com/scalar/scalar/issues/9414.
 *
 * The ingestion pipeline coerces documents against the generated OpenAPI schema. Before the JSON
 * Schema 2020-12 reference keywords were added to the Schema Object, that coercion dropped
 * `$dynamicRef` (and friends) from schemas reachable from an operation, so generic templates such as
 * `PaginatedResponse<T>` lost their dynamic item binding before anything could render it.
 */
describe('dynamic-ref coercion', () => {
  it('keeps $dynamicRef / $dynamicAnchor through ingestion for an operation-reachable schema', async () => {
    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        info: { title: 'DynamicRef', version: '0.0.0' },
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: 'A page of users',
                  content: {
                    'application/json': { schema: { $ref: '#/components/schemas/PaginatedUserResponse' } },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            User: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' } } },
            PaginatedTemplate: {
              $id: 'https://example.com/PaginatedTemplate',
              $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } },
              type: 'object',
              properties: { items: { type: 'array', items: { $dynamicRef: '#itemType' } } },
            },
            PaginatedUserResponse: {
              $id: 'https://example.com/PaginatedUserResponse',
              $defs: { itemType: { $dynamicAnchor: 'itemType', $ref: '#/components/schemas/User' } },
              $ref: '#/components/schemas/PaginatedTemplate',
            },
          },
        },
      },
    })

    const document = store.workspace.activeDocument
    expect(document && isOpenApiDocument(document)).toBe(true)
    if (!document || !isOpenApiDocument(document)) {
      return
    }

    const schemas = document.components?.schemas ?? {}

    // The template keeps the dynamic reference on its array items.
    const template = schemas.PaginatedTemplate
    const templateItems = template && 'properties' in template ? template.properties?.items : undefined
    const arrayItems = templateItems && 'items' in templateItems ? templateItems.items : undefined
    expect(arrayItems).toMatchObject({ $dynamicRef: '#itemType' })

    // The binding resource keeps its `$dynamicAnchor` so resolution can find the concrete item type.
    const binding = (schemas.PaginatedUserResponse as { $defs?: { itemType?: { $dynamicAnchor?: string } } }).$defs
      ?.itemType
    expect(binding?.$dynamicAnchor).toBe('itemType')
  })
})
