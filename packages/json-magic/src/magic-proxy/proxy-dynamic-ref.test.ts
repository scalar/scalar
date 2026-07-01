import { describe, expect, it } from 'vitest'

import { createMagicProxy } from '@/magic-proxy/proxy'

/**
 * The magic proxy resolves JSON Schema 2020-12 `$dynamicRef` transparently through the virtual
 * `$dynamicRef-value` property, threading the dynamic scope as the document is walked. These tests
 * exercise that behavior through the proxy itself (not the standalone resolver). See #9414.
 */
describe('magic proxy $dynamicRef-value', () => {
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

    const proxy = createMagicProxy(document) as any
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
        // A single shared generic template, referenced by both pages below.
        Paginated: {
          $id: 'urn:paginated',
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

    const proxy = createMagicProxy(document) as any

    const userItems = proxy.UserPage['$ref-value'].properties.items.items
    const groupItems = proxy.GroupPage['$ref-value'].properties.items.items

    // The very same template node resolves `#itemType` differently depending on the entry point — this
    // only works because the proxy cache is bypassed while a dynamic scope is active.
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

    const proxy = createMagicProxy(document) as any

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

    const proxy = createMagicProxy(document) as any

    // Without dynamic refs the proxy cache is untouched, so repeated access yields the same proxy.
    expect(proxy.$defs.shared).toBe(proxy.$defs.shared)
    expect(proxy.a['$ref-value']).toBe(proxy.b['$ref-value'])
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

    const proxy = createMagicProxy(document) as any
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
})
