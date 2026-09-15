import { describe, expect, it } from 'vitest'

import { documentReferences } from './document-references'

describe('document-references', () => {
  it('resolves pointers and anchors within a relative schema resource', () => {
    const schema = { $id: 'models/order.json', $anchor: 'Order', properties: { value: { type: 'string' } } }
    const root = {
      openapi: '3.2.1',
      $self: 'https://example.com/api/openapi.yaml',
      components: { schemas: { Order: schema } },
    }
    const references = documentReferences('x-ext')
    references.register(root, 'https://mirror.example.com/openapi.yaml')
    expect(references.origin(schema)).toBe('https://example.com/api/models/order.json')
    expect(references.resolve('#/properties/value', references.origin(schema)!)?.path).toBe(
      'components/schemas/Order/properties/value',
    )
    expect(references.resolve('models/order.json#Order', references.origin(root)!)?.value).toBe(schema)
  })

  it('resolves a document with a non-HTTP identity without fetching it', () => {
    const root = {
      openapi: '3.2.1',
      $self: 'urn:example:orders',
      components: { schemas: { Order: { type: 'string' } } },
    }
    const references = documentReferences('x-ext')
    references.register(root, '/orders.yaml')
    expect(references.resolve('urn:example:orders#/components/schemas/Order', '/')?.value).toEqual({ type: 'string' })
  })

  it('escapes pointer segments when locating an external document', () => {
    const root = { openapi: '3.2.1', $self: 'https://example.com/orders', paths: { '/orders': { summary: 'Orders' } } }
    const references = documentReferences('external')
    references.register(root, '/orders.yaml', ['external', 'orders/key'])
    expect(references.resolve('https://example.com/orders#/paths/~1orders', '/')?.path).toBe(
      'external/orders~1key/paths/~1orders',
    )
  })
})
