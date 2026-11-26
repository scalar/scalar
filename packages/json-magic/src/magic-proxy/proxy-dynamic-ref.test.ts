import { describe, expect, it, vi } from 'vitest'

import { collectDynamicAnchors, pushDynamicScope, resolveDynamicRef } from '@/magic-proxy/dynamic-ref'
import { createMagicProxy } from '@/magic-proxy/proxy'
import { DYNAMIC_REF_VALUE } from '@/magic-proxy/symbols'

/** A proxied document read by path, including the virtual `$ref-value` and `$dynamicRef-value` keys. */
type ProxyNode = { readonly [key: string]: ProxyNode }

/**
 * The magic proxy resolves JSON Schema 2020-12 `$dynamicRef` transparently through the virtual
 * `$dynamicRef-value` property, threading the dynamic scope as the document is walked. These tests
 * exercise that behavior through the proxy itself (not the standalone resolver). See #9414.
 */
describe('proxy-dynamic-ref', () => {
  it('does not treat keyword maps or example data as schema resources', () => {
    const proxy = createMagicProxy({
      $defs: { item: { $dynamicAnchor: 'item', title: 'User' } },
      properties: {
        $defs: { type: 'string' },
        list: { items: { $dynamicRef: '#item' } },
      },
      example: {
        $id: 'urn:payload',
        $defs: { item: { $dynamicAnchor: 'item', title: 'Payload' } },
        $dynamicRef: '#item',
      },
    }) as unknown as ProxyNode

    expect(proxy.properties.list.items['$dynamicRef-value'].title).toBe('User')
    expect(proxy.example['$dynamicRef-value']).toBeUndefined()
    expect(proxy.example.$defs.item).toBe(proxy.example.$defs.item)
    expect(collectDynamicAnchors(proxy.example).get('item')?.title).toBe('Payload')
  })

  it.each(['default', 'example', 'examples', 'enum', 'const'])(
    'binds dynamic references inside the component schema named %s',
    (name) => {
      const proxy = createMagicProxy({
        openapi: '3.1.0',
        info: { title: 'Example API', version: '1.0.0' },
        components: {
          schemas: {
            [name]: {
              $id: 'urn:page',
              $defs: { item: { $dynamicAnchor: 'item', title: 'Item' } },
              items: { $dynamicRef: '#item' },
            },
          },
        },
      }) as unknown as ProxyNode

      expect(proxy.components.schemas[name].items['$dynamicRef-value']?.title).toBe('Item')
    },
  )

  it('binds dynamic references inside the default OpenAPI response', () => {
    const proxy = createMagicProxy({
      openapi: '3.1.0',
      info: { title: 'Example API', version: '1.0.0' },
      paths: {
        '/items': {
          get: {
            responses: {
              default: {
                description: 'Items',
                content: {
                  'application/json': {
                    schema: {
                      $id: 'urn:page',
                      $defs: { item: { $dynamicAnchor: 'item', title: 'Item' } },
                      items: { $dynamicRef: '#item' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }) as unknown as ProxyNode

    const schema = proxy.paths['/items'].get.responses.default.content['application/json'].schema
    expect(schema.items['$dynamicRef-value']?.title).toBe('Item')
  })

  it('keeps a property named $id inside its schema resource', () => {
    const proxy = createMagicProxy({
      $defs: {
        Page: {
          $id: 'urn:page',
          $defs: { item: { $dynamicAnchor: 'item', title: 'Default' } },
          properties: { $id: { type: 'string' }, list: { items: { $dynamicRef: '#item' } } },
        },
        UserPage: {
          $id: 'urn:users',
          $ref: 'urn:page',
          $defs: { item: { $dynamicAnchor: 'item', title: 'User' } },
        },
      },
    }) as unknown as ProxyNode

    expect(proxy.$defs.UserPage['$ref-value'].properties.list.items['$dynamicRef-value'].title).toBe('User')
  })

  it.each(['#detail', 'detail.json'])('resolves %s inside a bound anchor against its owning resource', (ref) => {
    const proxy = createMagicProxy({
      $defs: {
        Page: {
          $id: 'https://example.com/page.json',
          $defs: {
            item: { $dynamicAnchor: 'item' },
            detail: { $anchor: 'detail', title: 'Wrong' },
          },
          items: { $dynamicRef: '#item' },
        },
        UserPage: {
          $id: 'https://example.com/users/page.json',
          $ref: 'https://example.com/page.json',
          $defs: {
            item: { $dynamicAnchor: 'item', properties: { detail: { $ref: ref } } },
            detail: { $id: 'detail.json', title: 'User' },
            anchored: { $anchor: 'detail', title: 'User' },
          },
        },
      },
    }) as unknown as ProxyNode

    const bound = proxy.$defs.UserPage['$ref-value'].items['$dynamicRef-value']
    expect(bound.properties.detail['$ref-value'].title).toBe('User')
    expect(proxy.$defs.UserPage['$ref-value'].items['$dynamicRef-value']).toBe(bound)
  })

  it('reads and writes percent-encoded references under an active dynamic scope', () => {
    const proxy = createMagicProxy({
      $id: 'urn:encoded',
      $defs: { item: { $dynamicAnchor: 'item' }, 'a/b %': { title: 'Original' } },
      properties: { value: { $ref: '#/$defs/a~1b%20%25' } },
    }) as unknown as ProxyNode
    const reference = proxy.properties.value
    expect(reference['$ref-value'].title).toBe('Original')
    Reflect.set(reference, '$ref-value', { title: 'Updated' })
    expect(reference['$ref-value'].title).toBe('Updated')
    expect(proxy.$defs['a/b %'].title).toBe('Updated')
  })

  it.each([false, true])('invalidates only the edited document, with a merged view: %s', (merged) => {
    const createDocument = () =>
      createMagicProxy({
        $id: 'urn:page',
        $defs: { item: { $dynamicAnchor: 'item', title: 'User' } },
        items: { $dynamicRef: '#item' },
      })
    const edited = createDocument()
    const untouched = createDocument()
    const editedView = merged ? { ...edited } : edited
    const untouchedView = merged ? { ...untouched } : untouched
    const editedAnchors = collectDynamicAnchors(editedView)
    const untouchedAnchors = collectDynamicAnchors(untouchedView)
    const untouchedItem = Reflect.get(untouched.items, '$dynamicRef-value')

    edited.$defs.item = { $dynamicAnchor: 'item', title: 'Group' }

    expect(collectDynamicAnchors(editedView)).not.toBe(editedAnchors)
    expect(collectDynamicAnchors(editedView).get('item')?.title).toBe('Group')
    expect(Reflect.get(edited.items, '$dynamicRef-value').title).toBe('Group')
    expect(collectDynamicAnchors(untouchedView)).toBe(untouchedAnchors)
    expect(Reflect.get(untouched.items, '$dynamicRef-value')).toBe(untouchedItem)
  })

  it('refreshes inherited scopes on child proxies saved before an anchor is added', () => {
    const proxy = createMagicProxy({
      $id: 'urn:page',
      $defs: {} as Record<string, { $dynamicAnchor: string; title: string }>,
      items: { $dynamicRef: '#item' },
    })
    const items = proxy.items
    expect(Reflect.get(items, '$dynamicRef-value')).toBeUndefined()
    proxy.$defs.item = { $dynamicAnchor: 'item', title: 'User' }
    expect(Reflect.get(proxy.items, '$dynamicRef-value').title).toBe('User')
    expect(Reflect.get(items, '$dynamicRef-value').title).toBe('User')
    delete proxy.$defs.item
    expect(Reflect.get(items, '$dynamicRef-value')).toBeUndefined()
    proxy.$defs.item = { $dynamicAnchor: 'item', title: 'Group' }
    expect(Reflect.get(items, '$dynamicRef-value').title).toBe('Group')
  })

  it('resolves a dynamic reference declared on its resource boundary', () => {
    const proxy = createMagicProxy({
      $id: 'urn:resource',
      $dynamicRef: '#node',
      $defs: { node: { $dynamicAnchor: 'node', type: 'string' } },
    })

    expect(Reflect.get(proxy, '$dynamicRef-value').type).toBe('string')
  })

  it('does not borrow a bookend across a dynamic reference resource boundary', () => {
    const proxy = createMagicProxy({
      $id: 'urn:outer',
      $defs: { node: { $dynamicAnchor: 'node', type: 'string' } },
      properties: { nested: { $id: 'urn:inner', $dynamicRef: '#node' } },
    })

    expect(Reflect.get(proxy.properties.nested, '$dynamicRef-value')).toBeUndefined()
  })

  it.each([{ $dynamicAnchor: 'other' }, { $defs: {} }])(
    'keeps inline anchor containers in their enclosing resource: %j',
    (container) => {
      const document = {
        $id: 'urn:resource',
        properties: {
          target: { $dynamicAnchor: 'node', type: 'string' },
          nested: { ...container, properties: { use: { $dynamicRef: '#node' } } },
        },
      }
      const proxy = createMagicProxy(document)
      const scope = pushDynamicScope(pushDynamicScope([], document), document.properties.nested)

      expect(resolveDynamicRef('#node', scope)).toStrictEqual(document.properties.target)
      expect(Reflect.get(proxy.properties.nested.properties.use, '$dynamicRef-value')).toStrictEqual({
        $dynamicAnchor: 'node',
        type: 'string',
      })
    },
  )

  it('requires a bookend in a nested explicit resource', () => {
    const proxy = createMagicProxy({
      $id: 'urn:outer',
      properties: {
        target: { $dynamicAnchor: 'node', type: 'string' },
        nested: { $id: 'urn:inner', properties: { use: { $dynamicRef: '#node' } } },
      },
    })

    expect(Reflect.get(proxy.properties.nested.properties.use, '$dynamicRef-value')).toBeUndefined()
  })

  it('resolves an anchor at the root without an explicit resource identifier', () => {
    const proxy = createMagicProxy({
      $dynamicAnchor: 'node',
      type: 'object',
      properties: { use: { $dynamicRef: '#node' } },
    })

    const bound = Reflect.get(proxy.properties.use, '$dynamicRef-value')
    expect(bound.type).toBe('object')
    expect(bound.$dynamicAnchor).toBe('node')
  })

  it('resolves a $dynamicRef against an anchor in the same resource', () => {
    const document = {
      // A recursive category tree: the anchor sits nested under `properties.root`, the ref under
      // `children.items`, both inside the same `$id` resource.
      CategoryTree: {
        $id: 'https://example.com/CategoryTree',
        type: 'object',
        properties: {
          root: {
            $dynamicAnchor: 'node',
            type: 'object',
            properties: {
              name: { type: 'string' },
              children: { type: 'array', items: { $dynamicRef: '#node' } },
            },
          },
        },
      },
    }

    const proxy = createMagicProxy(document) as unknown as ProxyNode
    const items = proxy.CategoryTree.properties.root.properties.children.items

    expect(items['$dynamicRef-value']).toMatchObject({ $dynamicAnchor: 'node' })
    // `$dynamicRef-value` is a get-only virtual accessor: it resolves on explicit access but stays out
    // of enumeration/reflection (unlike `$ref-value`) so it never leaks into spreads or serialization.
    expect('$dynamicRef-value' in items).toBe(false)
    expect(Object.keys(items)).not.toContain('$dynamicRef-value')
  })

  it('binds a shared template to a different type per path (path-dependent)', () => {
    const document = {
      $defs: {
        // A single shared generic template, referenced by both pages below. It declares a default
        // `#itemType` bookend so `$dynamicRef` binds dynamically; each page overrides it in its own scope.
        Paginated: {
          $id: 'urn:paginated',
          $defs: { itemType: { $dynamicAnchor: 'itemType' } },
          type: 'object',
          properties: {
            items: { type: 'array', items: { $dynamicRef: '#itemType' } },
          },
        },
      },
      UserPage: {
        $id: 'urn:user-page',
        '$ref': '#/$defs/Paginated',
        $defs: { itemType: { $dynamicAnchor: 'itemType', title: 'User' } },
      },
      GroupPage: {
        $id: 'urn:group-page',
        '$ref': '#/$defs/Paginated',
        $defs: { itemType: { $dynamicAnchor: 'itemType', title: 'Group' } },
      },
    }

    const proxy = createMagicProxy(document) as unknown as ProxyNode

    const userItems = proxy.UserPage['$ref-value'].properties.items.items
    const groupItems = proxy.GroupPage['$ref-value'].properties.items.items

    // The very same template node resolves `#itemType` differently depending on the entry point — this
    // works because proxies are cached separately for each active dynamic scope.
    expect(userItems['$dynamicRef-value']).toMatchObject({ title: 'User' })
    expect(groupItems['$dynamicRef-value']).toMatchObject({ title: 'Group' })
  })

  it('uses the lexical resource across pointer hops and URI-qualified dynamic references', () => {
    const proxy = createMagicProxy({
      template: {
        $id: 'https://example.com/schemas/template.json',
        $defs: {
          nested: {
            $id: 'nested/schema.json',
            $defs: { item: { $dynamicAnchor: 'item', title: 'Nested' } },
            properties: {
              fragment: { $dynamicRef: '#%69tem' },
              relative: { $dynamicRef: '../default.json#item' },
              absolute: { $dynamicRef: 'https://example.com/schemas/default.json#item' },
            },
          },
          fallback: { $id: 'default.json', $dynamicAnchor: 'item', title: 'Default' },
        },
      },
      direct: { $ref: '#/template/$defs/nested/properties/fragment' },
      first: {
        $id: 'https://example.com/bindings/first.json',
        $defs: { item: { $dynamicAnchor: 'item', title: 'First' } },
        $ref: 'https://example.com/schemas/nested/schema.json',
      },
      second: {
        $id: 'https://example.com/bindings/second.json',
        $defs: { item: { $dynamicAnchor: 'item', title: 'Second' } },
        $ref: 'https://example.com/schemas/nested/schema.json',
      },
    }) as unknown as ProxyNode

    expect(proxy.direct['$ref-value']['$dynamicRef-value'].title).toBe('Nested')

    const first = proxy.first['$ref-value'].properties
    const firstItem = first.fragment['$dynamicRef-value']
    expect(firstItem.title).toBe('First')
    expect(first.relative['$dynamicRef-value']).toBe(firstItem)
    expect(first.absolute['$dynamicRef-value']).toBe(firstItem)
    expect(proxy.first['$ref-value'].properties.relative['$dynamicRef-value']).toBe(firstItem)

    const second = proxy.second['$ref-value'].properties
    expect(second.relative['$dynamicRef-value'].title).toBe('Second')
    expect(second.relative['$dynamicRef-value']).not.toBe(firstItem)
  })

  it('indexes schema anchors inside named OpenAPI components and skips extension payloads', () => {
    const proxy = createMagicProxy({
      openapi: '3.2.0',
      info: { title: 'Scopes', version: '1' },
      components: {
        parameters: {
          default: {
            name: 'query',
            in: 'query',
            schema: {
              $id: 'https://example.com/query',
              $defs: { item: { $dynamicAnchor: 'item', const: 'query' } },
              properties: { term: { $dynamicRef: '#item' } },
            },
          },
        },
        schemas: {
          Use: { $ref: 'https://example.com/query' },
          Literal: { $dynamicRef: '#item' },
        },
      },
      'x-custom': { payload: { $dynamicAnchor: 'item', const: 'literal' } },
    }) as unknown as ProxyNode
    const query = proxy.components.parameters.default.schema
    expect(proxy.components.schemas.Use['$ref-value']).toBe(query)
    expect(query.properties.term['$dynamicRef-value'].const).toBe('query')
    expect(proxy.components.schemas.Literal['$dynamicRef-value']).toBeUndefined()
  })

  it('reuses a bundled implicit resource scope when entered through a pointer', () => {
    const proxy = createMagicProxy({
      template: { $id: 'https://example.com/default.json', $dynamicAnchor: 'item', const: 'default' },
      whole: { $ref: 'https://example.com/external.json' },
      part: { $ref: 'https://example.com/external.json#/properties/entry' },
      'x-ext': {
        external: {
          properties: {
            override: { $dynamicAnchor: 'item', const: 'override' },
            entry: { $dynamicRef: 'https://example.com/default.json#item' },
          },
        },
      },
      'x-ext-urls': { external: 'https://example.com/external.json' },
    }) as unknown as ProxyNode
    const entry = proxy.whole['$ref-value'].properties.entry
    expect(entry['$dynamicRef-value'].const).toBe('override')
    expect(proxy.part['$ref-value']).toBe(entry)
    expect(proxy.part['$ref-value']['$dynamicRef-value']).toBe(entry['$dynamicRef-value'])
  })

  it('resolves references to bundled resources by their retrieval URIs', () => {
    const proxy = createMagicProxy(
      {
        schema: {
          $id: 'https://example.com/schema.json',
          $defs: { outer: { $dynamicAnchor: 'item', title: 'Override' } },
          properties: {
            dynamic: { $dynamicRef: './models/other.json#item' },
            root: { $dynamicRef: './models/other.json' },
          },
        },
        'x-ext': { other: { $id: 'urn:other', $dynamicAnchor: 'item', title: 'Bundled' } },
        'x-ext-urls': { other: 'https://example.com/models/other.json' },
      },
      { documentUri: 'https://example.com/document.json' },
    ) as unknown as ProxyNode

    const properties = proxy.schema.properties
    expect(properties.dynamic['$dynamicRef-value'].title).toBe('Override')
    expect(properties.root['$dynamicRef-value'].title).toBe('Bundled')
  })

  it('resolves static targets without substituting a matching dynamic anchor', () => {
    const proxy = createMagicProxy({
      $id: 'https://example.com/root.json',
      $defs: {
        item: { $dynamicAnchor: 'item', title: 'Outer' },
        nested: {
          $id: 'nested/schema.json',
          $defs: {
            anchor: { $anchor: 'item', title: 'Static' },
            'a/b': { $dynamicAnchor: 'pointer', title: 'Pointer' },
            boolean: false,
          },
          properties: {
            anchor: { $dynamicRef: '#item' },
            qualified: { $dynamicRef: 'schema.json#item' },
            pointer: { $dynamicRef: '#/$defs/a~1b' },
            bool: { $dynamicRef: '#/$defs/boolean' },
            missing: { $dynamicRef: 'missing.json#item' },
            outside: { $dynamicRef: '#/$defs/pointer' },
          },
        },
        pointer: { $dynamicAnchor: 'pointer', title: 'Outer pointer' },
      },
    }) as unknown as ProxyNode

    const properties = proxy.$defs.nested.properties
    expect(properties.anchor['$dynamicRef-value'].title).toBe('Static')
    expect(properties.qualified['$dynamicRef-value']).toBe(properties.anchor['$dynamicRef-value'])
    expect(properties.pointer['$dynamicRef-value'].title).toBe('Pointer')
    expect(properties.bool['$dynamicRef-value']).toBe(false)
    expect(properties.missing['$dynamicRef-value']).toBeUndefined()
    expect(properties.outside['$dynamicRef-value']).toBeUndefined()
  })

  it('returns undefined for an unresolvable $dynamicRef and leaves plain schemas untouched', () => {
    const document = {
      Widget: {
        $id: 'urn:widget',
        type: 'object',
        properties: {
          // No matching `$dynamicAnchor` anywhere in scope.
          orphan: { $dynamicRef: '#missing' },
          plain: { type: 'string' },
        },
      },
    }

    const proxy = createMagicProxy(document) as unknown as ProxyNode

    expect(proxy.Widget.properties.orphan['$dynamicRef-value']).toBeUndefined()
    expect(proxy.Widget.properties.plain['$dynamicRef-value']).toBeUndefined()
    expect('$dynamicRef-value' in proxy.Widget.properties.plain).toBe(false)
  })

  it('keeps referential stability for documents without any $dynamicRef', () => {
    const document = {
      $defs: { shared: { type: 'object' } },
      a: { $ref: '#/$defs/shared' },
      b: { $ref: '#/$defs/shared' },
    }

    const proxy = createMagicProxy(document) as unknown as ProxyNode

    // Without dynamic refs the proxy cache is untouched, so repeated access yields the same proxy.
    expect(proxy.$defs.shared).toBe(proxy.$defs.shared)
    expect(proxy.a['$ref-value']).toBe(proxy.b['$ref-value'])
  })

  it('keeps ordinary shared targets stable when another branch uses dynamic references', () => {
    const document = {
      shared: { type: 'string' },
      first: { $id: 'urn:first', properties: { value: { $ref: '#/shared' } } },
      second: { $id: 'urn:second', properties: { value: { $ref: '#/shared' } } },
      dynamic: {
        $id: 'urn:dynamic',
        $dynamicAnchor: 'node',
        properties: { child: { $dynamicRef: '#node' } },
      },
    }
    const proxy = createMagicProxy(document)
    expect(Reflect.get(proxy.first.properties.value, '$ref-value')).toBe(
      Reflect.get(proxy.second.properties.value, '$ref-value'),
    )
    expect(Reflect.get(proxy.first.properties.value, '$ref-value')).toBe(proxy.shared)
  })

  it('keeps referential stability within a dynamic scope while separating scopes', () => {
    const document = {
      CategoryTree: {
        $id: 'https://example.com/CategoryTree',
        type: 'object',
        properties: {
          root: {
            $dynamicAnchor: 'node',
            type: 'object',
            properties: {
              name: { type: 'string' },
              children: { type: 'array', items: { $dynamicRef: '#node' } },
            },
          },
        },
      },
    }

    const proxy = createMagicProxy(document) as unknown as ProxyNode
    const items = proxy.CategoryTree.properties.root.properties.children.items

    // The recursive `#node` resolves to the same proxy on the same path: this is what lets cycle
    // detection terminate instead of expanding forever. (Before the scope-keyed cache it was a fresh
    // proxy every access.)
    const boundOnce = items['$dynamicRef-value']
    const boundAgain = items['$dynamicRef-value']
    expect(boundOnce).toBe(boundAgain)
    // And one level deeper, the same node resolves to that very same proxy.
    expect(boundOnce.properties.children.items['$dynamicRef-value']).toBe(boundOnce)
  })

  it('reuses scoped proxies across repeated reads of 64 bindings', () => {
    const document = {
      template: {
        $id: 'urn:template',
        $defs: { item: { $dynamicAnchor: 'item' } },
        properties: { items: { type: 'array', items: { $dynamicRef: '#item' } } },
      },
      bindings: Object.fromEntries(
        Array.from({ length: 64 }, (_, index) => [
          `binding${index}`,
          {
            $id: `urn:binding:${index}`,
            $ref: '#/template',
            $defs: {
              item: {
                $dynamicAnchor: 'item',
                title: `Item ${index}`,
                type: 'object',
                properties: { value: { type: 'string' } },
              },
            },
          },
        ]),
      ),
    }
    const proxy = createMagicProxy(document)
    const templates = new Set<object>()
    const visited = new Set<object>()

    for (let pass = 0; pass < 10; pass++) {
      for (const [index, binding] of Object.values(proxy.bindings).entries()) {
        const template = Reflect.get(binding, '$ref-value')
        const properties = template.properties
        const items = properties.items
        const reference = items.items
        const bound = Reflect.get(reference, '$dynamicRef-value')
        expect(bound.title).toBe(`Item ${index}`)
        templates.add(template)
        for (const node of [template, properties, items, reference, bound, bound.properties, bound.properties.value]) {
          visited.add(node)
        }
      }
      // Seven accessed targets per binding; another read must not allocate new identities.
      expect(templates.size).toBe(64)
      expect(visited.size).toBe(448)
    }
  })

  /** A generic page template with a default `#itemType` bookend. */
  const pageTemplate = (): Record<string, unknown> => ({
    $defs: { item: { $dynamicAnchor: 'itemType', not: {} } },
    type: 'object',
    properties: { items: { type: 'array', items: { $dynamicRef: '#itemType' } } },
  })

  it('binds dynamic references added to the document after an earlier read', () => {
    // The store adds content to a live document (lazy chunks, client edits). An earlier read of an
    // ordinary `$defs` schema must not freeze the document as "has no dynamic references".
    const proxy = createMagicProxy({
      components: { schemas: { Plain: { $defs: { x: { type: 'string' } } } } },
    }) as unknown as Record<string, Record<string, Record<string, unknown>>>
    expect(Reflect.get(proxy.components.schemas, 'Plain')).toBeDefined()

    proxy.components.schemas.Page = pageTemplate()
    proxy.components.schemas.UserPage = {
      $id: 'urn:user-page',
      $ref: '#/components/schemas/Page',
      $defs: { item: { $dynamicAnchor: 'itemType', title: 'User' } },
    }

    const read = proxy as unknown as ProxyNode
    const items = read.components.schemas.UserPage['$ref-value'].properties.items.items
    expect(items['$dynamicRef-value']).toMatchObject({ title: 'User' })
  })

  it('refreshes anchors and scoped references after set and delete edits', () => {
    const proxy = createMagicProxy({
      $id: 'urn:root',
      $defs: { item: { $dynamicAnchor: 'item', type: 'string' } },
      properties: { value: { $dynamicRef: '#item' }, ref: { $ref: '#/$defs/item' } },
    })
    const read = (): unknown => Reflect.get(proxy.properties.value, '$dynamicRef-value')
    const initial = read()
    expect(initial).toStrictEqual({ $dynamicAnchor: 'item', type: 'string' })
    expect(read()).toBe(initial)
    expect(Reflect.get(proxy.properties.ref, '$ref-value').type).toBe('string')

    proxy.$defs.item = { $dynamicAnchor: 'item', type: 'number' }
    expect(read()).toStrictEqual({ $dynamicAnchor: 'item', type: 'number' })
    expect(Reflect.get(proxy.properties.ref, '$ref-value').type).toBe('number')

    Reflect.deleteProperty(proxy.$defs.item, '$dynamicAnchor')
    expect(read()).toBeUndefined()
    proxy.$defs.item.$dynamicAnchor = 'item'
    const restored = read()
    expect(restored).toStrictEqual({ $dynamicAnchor: 'item', type: 'number' })
    expect(read()).toBe(restored)
  })

  it('keeps ordinary proxy identities after an unrelated edit', () => {
    const proxy = createMagicProxy({ shared: { type: 'string' }, title: 'Before' })
    const shared = proxy.shared
    proxy.title = 'After'
    expect(proxy.shared).toBe(shared)
  })

  it('refreshes a retained dynamic reference when its lexical id and matching anchor are edited', () => {
    const proxy = createMagicProxy({
      $id: 'https://example.com/root.json',
      $defs: {
        source: { $id: 'one/source.json', properties: { value: { $dynamicRef: 'target.json#item' } } },
        one: { $id: 'one/target.json', $dynamicAnchor: 'item', const: 'one' },
        two: { $id: 'two/target.json', $dynamicAnchor: 'item', const: 'two' },
      },
    })
    const value = proxy.$defs.source.properties.value
    const read = (): unknown => Reflect.get(value, DYNAMIC_REF_VALUE)

    expect(read()).toMatchObject({ const: 'one' })
    proxy.$defs.source.$id = 'two/source.json'
    expect(read()).toMatchObject({ const: 'two' })
    proxy.$defs.two.$dynamicAnchor = 'other'
    expect(read()).toBeUndefined()
    value.$dynamicRef = 'target.json#other'
    expect(read()).toMatchObject({ const: 'two' })
  })

  it('reuses the lexical index and dynamic target after annotation edits', () => {
    const inspect = vi.fn(() => ({ type: 'string' }))
    const proxy = createMagicProxy({
      $id: 'urn:example:root',
      title: 'Before',
      $defs: { item: { $dynamicAnchor: 'item', const: 'selected' } },
      properties: { value: { $dynamicRef: '#item' } },
      get unrelated() {
        return inspect()
      },
    })
    const read = (): unknown => Reflect.get(proxy.properties.value, DYNAMIC_REF_VALUE)
    const first = read()
    expect(first).toMatchObject({ const: 'selected' })
    expect(inspect).toHaveBeenCalledTimes(1)

    proxy.title = 'After'

    expect(read()).toBe(first)
    expect(inspect).toHaveBeenCalledTimes(1)
  })

  it('activates a previously scanned anchor-free resource after an in-place edit', () => {
    const proxy = createMagicProxy({
      $id: 'urn:root',
      $defs: { item: { type: 'string' } },
      properties: { value: { $dynamicRef: '#item' } },
    })
    expect(Reflect.get(proxy.properties.value, '$dynamicRef-value')).toBeUndefined()
    Reflect.set(proxy.$defs.item, '$dynamicAnchor', 'item')
    expect(Reflect.get(proxy.properties.value, '$dynamicRef-value')).toStrictEqual({
      $dynamicAnchor: 'item',
      type: 'string',
    })
  })

  it('binds a recursive anchor on a schema reached through a $ref from an explicit resource', () => {
    // `User` has no `$id`, so it does not belong to `urn:user-page` even though that resource led here.
    // Its own `#node` anchor must enter the scope so `friends` binds back to `User`.
    const proxy = createMagicProxy({
      components: {
        schemas: {
          Page: pageTemplate(),
          UserPage: {
            $id: 'urn:user-page',
            $ref: '#/components/schemas/Page',
            $defs: { item: { $dynamicAnchor: 'itemType', $ref: '#/components/schemas/User' } },
          },
          User: {
            $dynamicAnchor: 'node',
            type: 'object',
            properties: {
              name: { type: 'string' },
              friends: { type: 'array', items: { $dynamicRef: '#node' } },
            },
          },
        },
      },
    }) as unknown as ProxyNode

    const item = proxy.components.schemas.UserPage['$ref-value'].properties.items.items['$dynamicRef-value']
    const user = item['$ref-value']
    expect(user.properties.friends.items['$dynamicRef-value']).toMatchObject({ $dynamicAnchor: 'node' })
  })

  it('binds through a template whose unrelated $defs make it a scope entry', () => {
    // Neither schema has an `$id`, so the binding's `#itemType` is the bookend for the whole document.
    const build = (templateDefs: boolean): ProxyNode =>
      createMagicProxy({
        components: {
          schemas: {
            Template: {
              ...(templateDefs ? { $defs: { Meta: { type: 'object' } } } : {}),
              type: 'object',
              properties: { items: { type: 'array', items: { $dynamicRef: '#itemType' } } },
            },
            UserPage: {
              $ref: '#/components/schemas/Template',
              $defs: { item: { $dynamicAnchor: 'itemType', title: 'User' } },
            },
          },
        },
      }) as unknown as ProxyNode

    for (const templateDefs of [false, true]) {
      const items = build(templateDefs).components.schemas.UserPage['$ref-value'].properties.items.items
      expect(items['$dynamicRef-value']).toMatchObject({ title: 'User' })
    }
  })

  it('keeps $ref-value identity under an active dynamic scope', () => {
    const proxy = createMagicProxy({
      components: {
        schemas: {
          Page: pageTemplate(),
          UserPage: {
            $id: 'urn:user-page',
            $ref: '#/components/schemas/Page',
            $defs: { item: { $dynamicAnchor: 'itemType', title: 'User' } },
          },
        },
      },
    }) as unknown as ProxyNode

    const page = proxy.components.schemas.UserPage
    expect(page['$ref-value']).toBe(page['$ref-value'])
  })
})
