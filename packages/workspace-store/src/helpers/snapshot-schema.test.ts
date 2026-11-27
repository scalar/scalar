import { DYNAMIC_REF_VALUE, createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'

import { snapshotSchema } from './snapshot-schema'

describe('snapshot-schema', () => {
  it('preserves shared and recursive nodes without retaining the original objects', () => {
    const source: { name: string; parent?: unknown } = { name: 'Earth' }
    source.parent = source
    const snapshot = snapshotSchema({ first: source, second: source })
    expect(snapshot.first).not.toBe(source)
    expect(snapshot.first).toBe(snapshot.second)
    expect(snapshot.first.parent).toBe(snapshot.first)
  })

  it('preserves non-enumerable reference targets used by static documents', () => {
    const target = { type: 'string', example: 'Earth' }
    const reference = { $ref: '#/components/schemas/Name' }
    Object.defineProperty(reference, '$ref-value', { value: target })
    const snapshot = snapshotSchema(reference)
    expect(Reflect.get(snapshot, '$ref-value')).toStrictEqual(target)
    expect(Reflect.get(snapshot, '$ref-value')).not.toBe(target)
    expect(JSON.stringify(snapshot)).toBe('{"$ref":"#/components/schemas/Name"}')
  })

  it('preserves dynamic targets in their own scopes without serializing them', () => {
    const bind = (name: string) => ({
      $id: `urn:${name}`,
      $ref: 'urn:template',
      $defs: { item: { $dynamicAnchor: 'item', title: name } },
    })
    const source = createMagicProxy({
      first: bind('first'),
      second: bind('second'),
      template: {
        $id: 'urn:template',
        $defs: { item: { $dynamicAnchor: 'item' } },
        items: { $dynamicRef: '#item' },
      },
    })
    const first = Reflect.get(source.first, '$ref-value').items
    const second = Reflect.get(source.second, '$ref-value').items
    const snapshot = snapshotSchema({ first, second, repeated: first })

    expect(snapshot.first).toBe(snapshot.repeated)
    expect(Reflect.get(snapshot.first, DYNAMIC_REF_VALUE)?.title).toBe('first')
    expect(Reflect.get(snapshot.second, DYNAMIC_REF_VALUE)?.title).toBe('second')
    expect(JSON.stringify(snapshot.first)).toBe('{"$dynamicRef":"#item"}')
  })

  it('captures reactive edits without changing earlier snapshots', () => {
    const source = reactive({ type: 'string', example: 'Earth' })
    const before = snapshotSchema(source)
    source.example = 'Mars'
    expect(before).toStrictEqual({ type: 'string', example: 'Earth' })
    expect(snapshotSchema(source)).toStrictEqual({ type: 'string', example: 'Mars' })
  })
})
