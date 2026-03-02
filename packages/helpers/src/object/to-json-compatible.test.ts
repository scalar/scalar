import { describe, expect, it } from 'vitest'

import { toJsonCompatible } from './to-json-compatible'

describe('primitive values', () => {
  it('returns null as-is', () => {
    expect(toJsonCompatible(null)).toBe(null)
  })

  it('returns undefined as-is', () => {
    expect(toJsonCompatible(undefined)).toBe(undefined)
  })

  it('returns strings as-is', () => {
    expect(toJsonCompatible('hello')).toBe('hello')
  })

  it('returns numbers as-is', () => {
    expect(toJsonCompatible(42)).toBe(42)
  })

  it('returns booleans as-is', () => {
    expect(toJsonCompatible(true)).toBe(true)
    expect(toJsonCompatible(false)).toBe(false)
  })
})

describe('simple objects without circular references', () => {
  it('returns empty object', () => {
    expect(toJsonCompatible({})).toEqual({})
  })

  it('returns a deep copy', () => {
    const obj = { name: 'test', nested: { value: 1 } }
    const result = toJsonCompatible(obj)

    expect(result).toEqual(obj)
    expect(result).not.toBe(obj)
    expect((result as any).nested).not.toBe(obj.nested)
  })

  it('does not mutate the original object', () => {
    const obj = { name: 'test', nested: { value: 1 } }
    const original = JSON.parse(JSON.stringify(obj))

    toJsonCompatible(obj)
    expect(obj).toEqual(original)
  })
})

describe('arrays', () => {
  it('returns empty array', () => {
    expect(toJsonCompatible([])).toEqual([])
  })

  it('returns array of primitives unchanged', () => {
    expect(toJsonCompatible([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('preserves sparse arrays (holes)', () => {
    const input: unknown[] = []
    input[1] = 'a'
    input[3] = 'b'

    const result = toJsonCompatible(input)

    expect(Array.isArray(result)).toBe(true)
    expect((result as unknown[]).length).toBe(4)
    expect(0 in (result as unknown[])).toBe(false)
    expect(1 in (result as unknown[])).toBe(true)
    expect(2 in (result as unknown[])).toBe(false)
    expect(3 in (result as unknown[])).toBe(true)
    expect(result).toEqual(input)
  })

  it('replaces root self-referencing array item with $ref', () => {
    const input: unknown[] = []
    input.push(input)

    const result = toJsonCompatible(input)

    expect(result).toEqual([{ $ref: '#' }])
  })

  it('replaces circular reference from array item back to parent object', () => {
    const parent: Record<string, unknown> = {
      items: [],
    }
    ;(parent.items as unknown[]).push(parent)

    const result = toJsonCompatible(parent)

    expect(result).toEqual({
      items: [{ $ref: '#' }],
    })
  })
})

describe('circular and shared references', () => {
  it('replaces self-referencing object with $ref', () => {
    const obj: Record<string, unknown> = { name: 'test' }
    obj.self = obj

    const result = toJsonCompatible(obj)
    expect(result).toEqual({
      name: 'test',
      self: { $ref: '#' },
    })
  })

  it('replaces circular reference in nested object', () => {
    const parent: Record<string, unknown> = { name: 'parent' }
    const child: Record<string, unknown> = { name: 'child', parent }
    parent.child = child

    const result = toJsonCompatible(parent)
    expect(result).toEqual({
      name: 'parent',
      child: {
        name: 'child',
        parent: { $ref: '#' },
      },
    })
  })

  it('handles multiple references to the same object', () => {
    const shared = { value: 42 }
    const obj = {
      first: shared,
      second: shared,
    }

    const result = toJsonCompatible(obj)
    expect(result).toEqual({
      first: { value: 42 },
      second: { $ref: '#/first' },
    })
  })

  it('replaces circular reference to intermediate node', () => {
    const root: Record<string, unknown> = {
      child: {
        grandchild: {},
      },
    }
    ;(root.child as Record<string, unknown>).grandchild = root.child

    const result = toJsonCompatible(root)
    expect(result).toEqual({
      child: {
        grandchild: { $ref: '#/child' },
      },
    })
  })
})

describe('JSON Pointer encoding', () => {
  it('escapes "/" and "~" in object keys', () => {
    const shared = { value: 1 }
    const obj = {
      'a/b': shared,
      second: shared,
    }

    const result = toJsonCompatible(obj)
    expect(result).toEqual({
      'a/b': { value: 1 },
      second: { $ref: '#/a~1b' },
    })
  })

  it('escapes "~" as "~0"', () => {
    const shared = { value: 1 }
    const obj = {
      'a~b': shared,
      second: shared,
    }

    const result = toJsonCompatible(obj)
    expect(result).toEqual({
      'a~b': { value: 1 },
      second: { $ref: '#/a~0b' },
    })
  })

  it('escapes keys containing both "~" and "/"', () => {
    const shared = { value: 1 }
    const obj = {
      'a~/b': shared,
      second: shared,
    }

    const result = toJsonCompatible(obj)

    expect(result).toEqual({
      'a~/b': { value: 1 },
      second: { $ref: '#/a~0~1b' },
    })
  })
})

describe('prefix option', () => {
  it('adds prefix to $ref path', () => {
    const obj: Record<string, unknown> = { name: 'test' }
    obj.self = obj

    const result = toJsonCompatible(obj, { prefix: '/components/schemas' })
    expect(result).toEqual({
      name: 'test',
      self: { $ref: '#/components/schemas' },
    })
  })

  it('adds prefix to nested $ref path', () => {
    const shared = { value: 1 }
    const obj = {
      a: shared,
      b: shared,
    }

    const result = toJsonCompatible(obj, { prefix: '/definitions' })
    expect(result).toEqual({
      a: { value: 1 },
      b: { $ref: '#/definitions/a' },
    })
  })
})
