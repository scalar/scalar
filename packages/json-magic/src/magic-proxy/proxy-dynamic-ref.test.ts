import { describe, expect, it } from 'vitest'

import { pushDynamicScope, resolveDynamicRef } from '@/magic-proxy/dynamic-ref'
import { createMagicProxy } from '@/magic-proxy/proxy'

/** A proxied document read by path, including the virtual `$ref-value` and `$dynamicRef-value` keys. */
type ProxyNode = { readonly [key: string]: ProxyNode }

/**
 * The magic proxy resolves JSON Schema 2020-12 `$dynamicRef` transparently through the virtual
 * `$dynamicRef-value` property, threading the dynamic scope as the document is walked. These tests
 * exercise that behavior through the proxy itself (not the standalone resolver). See #9414.
 */
describe('proxy-dynamic-ref', () => {
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
