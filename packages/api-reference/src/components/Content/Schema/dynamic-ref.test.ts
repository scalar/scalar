import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Schema from './Schema.vue'

/**
 * Builds a `PaginatedResponse<T>`-style resource as the workspace store hands it to rendering: a named
 * schema that extends a shared template through a root `$ref`, binding the template's `$dynamicRef` item
 * type via a sibling `$defs.itemType`. The whole document is wrapped in a real magic proxy so `$ref` and
 * `$dynamicRef` resolve exactly as they do in production — the component never assembles a scope itself.
 */
const buildPaginatedResource = (item: Record<string, unknown>) => {
  const root = {
    components: {
      schemas: {
        Item: item,
        PaginatedTemplate: {
          $id: 'https://example.com/schemas/PaginatedTemplate',
          $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } },
          type: 'object',
          required: ['items', 'total'],
          properties: {
            items: { type: 'array', items: { $dynamicRef: '#itemType' } },
            total: { type: 'integer' },
          },
        },
        PaginatedResponse: {
          $id: 'https://example.com/schemas/PaginatedResponse',
          $defs: { itemType: { $dynamicAnchor: 'itemType', $ref: '#/components/schemas/Item' } },
          $ref: '#/components/schemas/PaginatedTemplate',
        },
      },
    },
  }

  return (createMagicProxy(root) as any).components.schemas.PaginatedResponse
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
    // Rendering the bare template keeps prior behavior: the item type binds to the template's own anchor.
    const root = {
      components: {
        schemas: {
          PaginatedTemplate: {
            $id: 'https://example.com/schemas/PaginatedTemplate',
            $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } },
            type: 'object',
            properties: { items: { type: 'array', items: { $dynamicRef: '#itemType' } } },
          },
        },
      },
    }
    const template = (createMagicProxy(root) as any).components.schemas.PaginatedTemplate
    const text = mountSchema(template).text()
    expect(text).toContain('items')
  })
})
