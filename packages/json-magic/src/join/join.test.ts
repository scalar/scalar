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

  it.each(['__proto__', 'constructor', 'prototype'])('excludes unsafe keys at every depth (%s)', (key) => {
    const input = JSON.parse(
      `{"${key}":{"polluted":true},"nested":{"${key}":{"polluted":true}},"items":[{"${key}":1}]}`,
    )
    expect(join([input])).toStrictEqual({ ok: true, document: { nested: {}, items: [{}] } })
    expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false)
  })

  it('treats inherited-looking keys as ordinary own properties', () => {
    expect(join([{ toString: { a: 1 } }, { toString: { b: 2 } }])).toStrictEqual({
      ok: true,
      document: { toString: { a: 1, b: 2 } },
    })
  })
})
