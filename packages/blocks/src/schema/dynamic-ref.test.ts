import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Schema from './Schema.vue'

/**
 * Builds a `PaginatedResponse<T>`-style resource as the workspace store represents it: a named schema
 * that extends a shared template through a root `$ref`, binding the template's `$dynamicRef` item type
 * via a sibling `$defs.itemType`. The `$ref`/`$ref-value` pairs mirror the store's resolved magic proxy.
 */
const buildPaginatedResource = (item: Record<string, unknown>) => {
  const template = {
    $id: 'https://example.com/schemas/PaginatedTemplate',
    $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } },
    type: 'object',
    required: ['items', 'total'],
    properties: {
      items: { type: 'array', items: { $dynamicRef: '#itemType' } },
      total: { type: 'integer' },
    },
  }

  return {
    $id: 'https://example.com/schemas/PaginatedResponse',
    $defs: {
      itemType: { $dynamicAnchor: 'itemType', $ref: '#/components/schemas/Item', '$ref-value': item },
    },
    $ref: '#/components/schemas/PaginatedTemplate',
    '$ref-value': template,
  } as unknown as Parameters<typeof mountSchema>[0]
}

const mountSchema = (schema: unknown) =>
  mount(Schema, {
    props: {
      // Expanding everything lets us assert on nested item properties without driving disclosures.
      options: { expandAllSchemaProperties: true },
      eventBus: null,
      schema: schema as never,
      level: 1,
      noncollapsible: true,
    } as never,
  })

describe('Schema $dynamicRef rendering', () => {
  it('renders a template resource by showing its inherited properties', () => {
    const text = mountSchema(buildPaginatedResource({ type: 'object', properties: { id: { type: 'string' } } })).text()
    expect(text).toContain('items')
    expect(text).toContain('total')
  })

  it('binds the dynamic array item type to the concrete bound schema', () => {
    const user = {
      type: 'object',
      required: ['id', 'email'],
      properties: { id: { type: 'string' }, email: { type: 'string', format: 'email' } },
    }
    const text = mountSchema(buildPaginatedResource(user)).text()

    // The shared `items: { $dynamicRef: '#itemType' }` slot now renders the bound `User` shape.
    expect(text).toContain('email')
    expect(text).toContain('id')
  })

  it('resolves the same template to different item types per binding', () => {
    const groupText = mountSchema(
      buildPaginatedResource({ type: 'object', properties: { groupName: { type: 'string' } } }),
    ).text()

    expect(groupText).toContain('groupName')
    expect(groupText).not.toContain('email')
  })

  it('leaves an unresolved $dynamicRef array empty without crashing', () => {
    // Rendering the bare template (no binding in scope) keeps prior behavior: the item type is unbound.
    const template = {
      $id: 'https://example.com/schemas/PaginatedTemplate',
      $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } },
      type: 'object',
      properties: { items: { type: 'array', items: { $dynamicRef: '#itemType' } } },
    }
    const text = mountSchema(template).text()
    expect(text).toContain('items')
  })

  // Full-store reproduction of https://github.com/scalar/scalar/issues/9883: the binding schema is a
  // *named* component and the response references it by `$ref`, so Schema receives a bare `$ref` whose
  // `$id`/`$defs` binding lives behind the ref. The dynamic scope must follow the ref to bind the item.
  it('binds the array item type when the binding schema is referenced by name (#9883)', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        info: { title: 'DynamicRef', version: '0.1.0' },
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: 'User page',
                  content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedUserResponse' } } },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              required: ['id', 'email'],
              properties: { id: { type: 'string' }, email: { type: 'string', format: 'email' } },
            },
            PaginatedTemplate: {
              $id: 'https://example.com/schemas/PaginatedTemplate',
              $defs: { itemType: { $dynamicAnchor: 'itemType', not: true } },
              type: 'object',
              required: ['items'],
              properties: { items: { type: 'array', items: { $dynamicRef: '#itemType' } } },
            },
            PaginatedUserResponse: {
              $id: 'https://example.com/schemas/PaginatedUserResponse',
              $defs: { itemTypeAAA: { $dynamicAnchor: 'itemType', $ref: '#/components/schemas/User' } },
              $ref: '#/components/schemas/PaginatedTemplate',
            },
          },
        },
      } as never,
    })

    const doc = store.workspace.documents['default'] as any
    const schema = doc.paths['/users'].get.responses['200'].content['application/json'].schema

    const text = mountSchema(schema).text()

    // The `items: { $dynamicRef: '#itemType' }` slot renders the bound `User` shape (its properties).
    expect(text).toContain('email')
    expect(text).toContain('id')
  })
})
