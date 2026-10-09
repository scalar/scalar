import { describe, expect, it } from 'vitest'

import { join } from './index'

describe('join', () => {
  it('joins an empty list', () => {
    expect(join([])).toStrictEqual({ ok: true, document: {} })
  })

  it('merges nested objects and lets later values replace scalars and arrays', () => {
    expect(
      join([
        { settings: { color: 'red', nested: { enabled: true } }, items: [1, 2], nullable: {} },
        { settings: { color: 'blue', nested: { count: 3 } }, items: [3], nullable: null },
      ]),
    ).toStrictEqual({
      ok: true,
      document: { settings: { color: 'blue', nested: { enabled: true, count: 3 } }, items: [3], nullable: null },
    })
  })

  it('replaces whole objects when requested', () => {
    expect(join([{ settings: { a: 1 } }, { settings: { b: 2 } }], { strategy: () => 'replace' })).toStrictEqual({
      ok: true,
      document: { settings: { b: 2 } },
    })
  })

  it('reports duplicate entries with unambiguous path segments', () => {
    expect(
      join([{ catalog: { 'a/b~c': { value: 1 } } }, { catalog: { 'a/b~c': { value: 1 } } }], {
        strategy: ({ path }) => (path.length === 2 ? 'conflict' : 'merge'),
      }),
    ).toStrictEqual({ ok: false, conflicts: [{ path: ['catalog', 'a/b~c'] }] })
  })

  it.each([null, false, 0, '', undefined])('reports duplicate keys even when the earlier value is %s', (value) => {
    expect(join([{ key: value }, { key: 1 }], { strategy: () => 'conflict' })).toStrictEqual({
      ok: false,
      conflicts: [{ path: ['key'] }],
    })
  })

  it('collects conflicts across multiple fields and inputs', () => {
    expect(join([{ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3 }], { strategy: () => 'conflict' })).toStrictEqual({
      ok: false,
      conflicts: [{ path: ['a'] }, { path: ['b'] }, { path: ['a'] }],
    })
  })

  it('deduplicates arrays by identity, retaining the first occurrence', () => {
    expect(
      join(
        [
          { items: [{ id: 1, name: 'first' }, { id: 1, name: 'duplicate' }, { name: 'unnamed' }] },
          { items: [{ id: 1, name: 'later' }, { id: 2 }, { name: 'unnamed' }] },
        ],
        { strategy: () => ({ uniqueBy: 'id' }) },
      ),
    ).toStrictEqual({
      ok: true,
      document: { items: [{ id: 1, name: 'first' }, { name: 'unnamed' }, { id: 2 }, { name: 'unnamed' }] },
    })
  })

  it('leaves references untouched and does not infer a document standard', () => {
    expect(
      join([{ channels: { events: { $ref: '#/definitions/Event' } } }, { definitions: { Event: {} } }]),
    ).toStrictEqual({
      ok: true,
      document: { channels: { events: { $ref: '#/definitions/Event' } }, definitions: { Event: {} } },
    })
  })

  it('does not mutate inputs or share nested output objects with them', () => {
    const first = { settings: { nested: { enabled: true } }, items: [{ id: 1 }] }
    const second = { settings: { nested: { count: 2 } } }
    const result = join([first, second])
    expect(first).toStrictEqual({ settings: { nested: { enabled: true } }, items: [{ id: 1 }] })
    expect(second).toStrictEqual({ settings: { nested: { count: 2 } } })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.document.settings).not.toBe(first.settings)
      expect(result.document.settings).not.toBe(second.settings)
      expect(result.document.items).not.toBe(first.items)
      expect((result.document.items as unknown[])[0]).not.toBe(first.items[0])
    }
  })

  it.each(['__proto__', 'constructor', 'prototype'])(
    'preserves literal keys without prototype pollution (%s)',
    (key) => {
      const input = JSON.parse(
        `{"${key}":{"polluted":true},"nested":{"${key}":{"polluted":true}},"items":[{"${key}":1}]}`,
      )
      for (const strategy of ['merge', 'replace', 'merge-by-index'] as const) {
        const result = join([input, input], { strategy: () => strategy })
        // Strict object equality treats an own constructor value as the object type.
        expect(JSON.stringify(result)).toBe(JSON.stringify({ ok: true, document: input }))
        if (result.ok) {
          expect(Object.getPrototypeOf(result.document)).toBe(Object.prototype)
          expect(Object.hasOwn(result.document, key)).toBe(true)
        }
        expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false)
        expect(Reflect.get({}, 'polluted')).toBeUndefined()
      }
    },
  )

  it('merges nested arrays by index without mutating inputs', () => {
    const first = { items: [{ flags: [true, false], other: true }, { name: 'Second' }] }
    const second = { items: [{ flags: [false], name: 'First' }] }
    expect(join([first, second], { strategy: () => 'merge-by-index' })).toStrictEqual({
      ok: true,
      document: { items: [{ flags: [false, false], other: true, name: 'First' }, { name: 'Second' }] },
    })
    expect(first).toStrictEqual({ items: [{ flags: [true, false], other: true }, { name: 'Second' }] })
    expect(second).toStrictEqual({ items: [{ flags: [false], name: 'First' }] })
  })

  it('skips fields without adding undefined properties or changing existing values', () => {
    expect(
      join([{ keep: 1 }, { keep: 2, omit: 3 }], {
        strategy: ({ incoming }) => (incoming === 1 ? 'merge' : 'skip'),
      }),
    ).toStrictEqual({ ok: true, document: { keep: 1 } })
  })

  it('keeps literal keys in deduplicated array items', () => {
    const item = JSON.parse('{"id":1,"__proto__":{"polluted":true},"constructor":{"prototype":true}}')
    const result = join([{ items: [item] }, { items: [item] }], { strategy: () => ({ uniqueBy: 'id' }) })
    expect(JSON.stringify(result)).toBe(JSON.stringify({ ok: true, document: { items: [item] } }))
    expect(Reflect.get({}, 'polluted')).toBeUndefined()
  })

  it('treats inherited-looking keys as ordinary own properties', () => {
    expect(join([{ toString: { a: 1 } }, { toString: { b: 2 } }])).toStrictEqual({
      ok: true,
      document: { toString: { a: 1, b: 2 } },
    })
  })
})
