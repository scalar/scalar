import { isProxy } from 'node:util/types'

import { describe, expect, it } from 'vitest'

import { attachRefValues } from './attach-ref-values'

describe('attach-ref-values', () => {
  it('shares recursive targets without proxies or changing serialization', () => {
    const pet = { properties: { parent: { $ref: '#/components/schemas/Pet' } } }
    const document = { components: { schemas: { Pet: pet } }, first: { $ref: '#/components/schemas/Pet' } }
    const before = JSON.stringify(document)

    expect(attachRefValues(document)).toBe(false)
    expect(Reflect.get(document.first, '$ref-value')).toBe(pet)
    expect(Reflect.get(pet.properties.parent, '$ref-value')).toBe(pet)
    expect(isProxy(Reflect.get(document.first, '$ref-value'))).toBe(false)
    expect(JSON.stringify(document)).toBe(before)
  })

  it('resolves relative resource IDs and scoped anchors', () => {
    const target = { $anchor: 'pet', type: 'string' }
    const child = { $id: 'child.json', $defs: { target }, local: { $ref: '#pet' } }
    const document = {
      $id: 'https://example.com/root.json',
      components: { schemas: { child } },
      byAnchor: { $ref: 'child.json#pet' },
      byPointer: { $ref: 'child.json#/$defs/target' },
    }

    expect(attachRefValues(document)).toBe(false)
    expect(Reflect.get(child.local, '$ref-value')).toBe(target)
    expect(Reflect.get(document.byAnchor, '$ref-value')).toBe(target)
    expect(Reflect.get(document.byPointer, '$ref-value')).toBe(target)
  })

  it('resolves anchors without IDs, boolean schemas, and empty property names', () => {
    const target = { $anchor: 'pet', type: 'string' }
    const document = {
      '': false,
      components: { schemas: { target } },
      anchor: { $ref: '#pet' },
      empty: { $ref: '#/' },
      root: { $ref: '#' },
    }

    expect(attachRefValues(document)).toBe(false)
    expect(Reflect.get(document.anchor, '$ref-value')).toBe(target)
    expect(Reflect.get(document.empty, '$ref-value')).toBe(false)
    expect(Reflect.get(document.root, '$ref-value')).toBe(document)
  })

  it('requests bundling for external resources but not missing local targets', () => {
    expect(attachRefValues({ local: { $ref: '#missing' } })).toBe(false)
    expect(attachRefValues({ external: { $ref: './other.json#/Pet' } })).toBe(true)
    expect(attachRefValues({ $id: 'https://example.com/root.json', local: { $ref: '#missing' } })).toBe(false)
    expect(attachRefValues({ $id: 'https://example.com/root.json', external: { $ref: 'other.json' } })).toBe(true)
  })
})
