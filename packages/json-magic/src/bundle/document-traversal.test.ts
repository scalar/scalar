import { isObject } from '@scalar/helpers/object/is-object'
import { describe, expect, it } from 'vitest'

import { createMagicProxy } from '@/magic-proxy/proxy'

import { documentReferences } from './document-references'
import { documentTraversal } from './document-traversal'

const document = {
  asyncapi: '3.1.0',
  channels: { events: { messages: { event: { $ref: '#/components/messages/Event' } } } },
  components: {
    messages: {
      Event: {
        payload: { type: 'object' },
        examples: [{ payload: { $ref: './literal.json' }, headers: { $ref: './headers.json' } }],
      },
    },
  },
}

describe('document-traversal', () => {
  it('does not read document children when location indexing is disabled', () => {
    const input = {
      get child(): never {
        throw new Error('unnecessary traversal')
      },
    }
    const traversal = documentTraversal(input, { aware: false, enabled: false })
    traversal.register(input, '/')
    expect(traversal.location(input)).toBeUndefined()
  })

  it('skips inherited properties when exposing a fragment', () => {
    let reads = 0
    const input = {
      container: Object.create({
        get child(): undefined {
          reads++
          return undefined
        },
      }),
    }
    const traversal = documentTraversal(input)
    traversal.register(input, '/root.json')

    traversal.register(input, '/root.json', 'schema', ['container', 'child'])

    expect(reads).toBe(0)
  })

  it('exposes and indexes only the selected subtree after initial registration', () => {
    let reads = 0
    const untouched = {
      get child(): object {
        reads++
        return {}
      },
    }
    const selected = { $id: './selected', $anchor: 'selected', properties: { nested: { $ref: '#selected' } } }
    const other = { $anchor: 'other' }
    const input = { openapi: '3.1.0', 'x-data': { selected, other }, untouched }
    const traversal = documentTraversal(input)
    const references = documentReferences(
      'x-ext',
      undefined,
      false,
      (node) => traversal.location(node)?.context !== 'data',
      (node) =>
        traversal.location(node)?.context === 'schema' && isObject(node)
          ? {
              id: typeof node.$id === 'string' ? node.$id : undefined,
              anchor: typeof node.$anchor === 'string' ? node.$anchor : undefined,
            }
          : undefined,
    )
    traversal.register(input, 'https://example.com/root')
    references.register(input, 'https://example.com/root')
    const initialReads = reads
    traversal.register(input, 'https://example.com/root', 'schema', ['x-data', 'selected'])
    references.refresh(input, ['x-data', 'selected'])
    traversal.register(input, 'https://example.com/root', 'schema', ['x-data', 'other'])
    references.refresh(input, ['x-data', 'other'])
    expect(reads).toBe(initialReads)
    expect(traversal.location(input['x-data'])?.context).toBe('data-container')
    expect(traversal.location(selected)).toStrictEqual({
      source: 'https://example.com/root',
      pointer: '#/x-data/selected',
      context: 'schema',
      schemaSiblings: true,
    })
    expect(references.resolve('https://example.com/selected#selected', 'https://example.com/root')?.value).toBe(
      selected,
    )
    expect(references.resolve('#other', 'https://example.com/root')?.value).toBe(other)
    expect(references.origin(selected.properties.nested)).toBe('https://example.com/selected')
  })

  it('reuses the custom traversal when refreshing a registered subtree', () => {
    let reads = 0
    const selected = { $id: 'https://example.com/selected', $dynamicAnchor: 'selected' }
    const input = {
      openapi: '3.1.0',
      'x-schemas': { selected },
      get untouched(): object {
        reads++
        return {}
      },
    }
    const origin = 'https://example.com/root'
    const references = documentReferences('x-ext', undefined, false, undefined, undefined, undefined, {
      includeCustomReferences: true,
    })
    references.register(input, origin)
    const initialReads = reads

    selected.$dynamicAnchor = 'updated'
    references.refresh(input, ['x-schemas', 'selected'])

    expect(reads).toBe(initialReads)
    expect(references.resolve('https://example.com/selected#selected', origin)).toBeUndefined()
    expect(references.resolve('https://example.com/selected#updated', origin)?.value).toBe(selected)
  })

  it('assigns authored source locations to previously embedded documents', () => {
    const external = { properties: { missing: { $ref: '#/absent' } } }
    const input = { 'x-ext': { external } }
    const traversal = documentTraversal(input)
    traversal.register(input, '/root.json')
    traversal.register(external, '/external.json')
    expect(traversal.location(external.properties.missing)).toStrictEqual({
      source: '/external.json',
      pointer: '#/properties/missing',
      context: 'schema',
      schemaSiblings: true,
    })
  })
  it.each([false, true])('indexes message data at its authored location (proxied: %s)', (proxied) => {
    const source = structuredClone(document)
    const root = proxied ? createMagicProxy(source) : source
    const traversal = documentTraversal(root)
    traversal.register(root, '/')
    expect(traversal.location(root.components.messages.Event)).toStrictEqual({
      source: '/',
      pointer: '#/components/messages/Event',
      context: 'message',
      schemaSiblings: true,
    })
    expect(traversal.location(root.components.messages.Event.examples[0]!.payload)?.context).toBe('data')
    expect(traversal.location(root.components.messages.Event.examples[0]!.headers)?.context).toBe('data')
    expect(source).toStrictEqual(document)
  })

  it('indexes authored properties named $ref-value', () => {
    const root = createMagicProxy({
      asyncapi: '3.1.0',
      components: { messages: { '$ref-value': { examples: [{ payload: { $ref: './literal.json' } }] } } },
    })
    const traversal = documentTraversal(root)
    traversal.register(root, '/')
    expect(traversal.location(root.components.messages['$ref-value'])?.context).toBe('message')
    expect(traversal.location(root.components.messages['$ref-value'].examples[0]!.payload)?.context).toBe('data')
  })

  it.each([false, true])(
    'indexes Multi Format Schema references without following literal values (proxied: %s)',
    (proxied) => {
      const multiFormatSchema = {
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: {
          $ref: './schema.json',
          default: { schemaFormat: 'application/json', schema: { $ref: './literal.json' } },
        },
      }
      const input = {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Event: multiFormatSchema,
            LiteralKeyword: { schema: { $ref: './unknown-keyword.json' } },
          },
        },
      }
      const root = proxied ? createMagicProxy(input) : input
      const traversal = documentTraversal(root)
      traversal.register(root, '/')
      expect(traversal.location(root.components.schemas.Event.schema)?.context).toBe('draft-07-schema')
      expect(traversal.location(root.components.schemas.Event.schema.default.schema)?.context).toBe('data')
      expect(traversal.location(root.components.schemas.LiteralKeyword.schema)?.context).toBe('data')
    },
  )
})
