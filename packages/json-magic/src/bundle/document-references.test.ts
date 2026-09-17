import { describe, expect, it } from 'vitest'

import { type DocumentResolver, documentReferences } from './document-references'

const resolveDocument: DocumentResolver = (document) => {
  if (
    typeof document === 'object' &&
    document !== null &&
    'identity' in document &&
    typeof document.identity === 'string'
  ) {
    return { baseUri: document.identity }
  }
  return undefined
}

describe('document-references', () => {
  it('resolves pointers and anchors within a relative schema resource', () => {
    const schema = { $id: 'models/order.json', $anchor: 'Order', properties: { value: { type: 'string' } } }
    const root = {
      identity: 'https://example.com/api/openapi.yaml',
      components: { schemas: { Order: schema } },
    }
    const references = documentReferences('x-ext', resolveDocument)
    references.register(root, 'https://mirror.example.com/openapi.yaml')
    expect(references.origin(schema)).toBe('https://example.com/api/models/order.json')
    expect(references.resolve('#/properties/value', references.origin(schema)!)?.path).toBe(
      'components/schemas/Order/properties/value',
    )
    expect(references.resolve('models/order.json#Order', references.origin(root)!)?.value).toBe(schema)
  })

  it('resolves a document with a non-HTTP identity without fetching it', () => {
    const root = {
      identity: 'urn:example:orders',
      components: { schemas: { Order: { type: 'string' } } },
    }
    const references = documentReferences('x-ext', resolveDocument)
    references.register(root, '/orders.yaml')
    expect(references.resolve('urn:example:orders#/components/schemas/Order', '/')?.value).toStrictEqual({
      type: 'string',
    })
  })

  it('escapes pointer segments when locating an external document', () => {
    const root = { identity: 'https://example.com/orders', paths: { '/orders': { summary: 'Orders' } } }
    const references = documentReferences('external', resolveDocument)
    references.register(root, '/orders.yaml', ['external', 'orders/key'])
    expect(references.resolve('https://example.com/orders#/paths/~1orders', '/')?.path).toBe(
      'external/orders~1key/paths/~1orders',
    )
  })

  it('keeps resolver metadata separate from the source and its prototype', () => {
    const document = { identity: './api.json', value: { type: 'string' } }
    const original = structuredClone(document)
    const metadata: Record<string, unknown> = JSON.parse(
      '{"identity":"https://example.com/api.json","__proto__":{"polluted":true}}',
    )
    const references = documentReferences('x-ext', () => ({ baseUri: metadata.identity as string, metadata }))
    references.register(document, 'https://example.com/input.json')
    expect(document).toStrictEqual(original)
    expect(Object.getPrototypeOf(document)).toBe(Object.prototype)
    expect(references.identity(document)?.metadata).toBe(metadata)
    expect(references.resolve('https://example.com/api.json#/value', '/')?.value).toStrictEqual({ type: 'string' })
  })

  it('does not register a bundled document without a document key', () => {
    const references = documentReferences('x-ext')
    references.register({ value: true }, 'https://example.com/api.json', ['x-ext'])
    expect(references.resolve('#/x-ext', 'https://example.com/other.json')).toBeUndefined()
  })

  it.each([
    // embedded, schema identifier, reference, preserved
    [false, undefined, '#/value', true],
    [true, undefined, '#/value', false],
    [false, undefined, 'https://example.com/api.json#/value', false],
    [true, undefined, 'https://example.com/api.json#/value', false],
    [false, 'https://example.com/api.json', '#/value', true],
    [true, 'https://example.com/api.json', '#/value', true],
    [false, 'https://example.com/api.json', '#anchor', true],
    [true, 'https://example.com/api.json', '#anchor', true],
    [false, 'https://example.com/api.json', 'https://example.com/api.json#anchor', true],
    [true, 'https://example.com/api.json', 'https://example.com/api.json#anchor', false],
    [false, './api.json', 'https://example.com/api.json#/value', false],
    [true, './api.json', 'https://example.com/api.json#/value', false],
    [false, './api.json', 'api.json#/value', false],
    [true, './api.json', 'api.json#/value', false],
    [false, undefined, '#/missing', true],
    [true, undefined, '#/missing', true],
    [false, './api.json', '#/missing', true],
    [true, './api.json', '#/missing', true],
  ] as const)(
    'preserves references with embedded=%s, identifier=%s, ref=%s: %s',
    (embedded, identifier, ref, preserved) => {
      const document =
        identifier === undefined
          ? { value: { type: 'string' } }
          : { $id: identifier, $anchor: 'anchor', value: { type: 'string' } }
      const references = documentReferences('x-ext')
      references.register(document, 'https://example.com/api.json', embedded ? ['x-ext', 'external'] : [])
      expect(references.resolve(ref, 'https://example.com/api.json')?.preserveReference).toBe(preserved)
    },
  )
})
