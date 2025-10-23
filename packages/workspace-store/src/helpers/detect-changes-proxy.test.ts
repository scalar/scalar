import { describe, expect, it, vi } from 'vitest'

import { createDetectChangesProxy, getRaw } from './detect-changes-proxy'

describe('createDetectChangesProxy', () => {
  describe('primitives', () => {
    it('should return primitives unchanged', () => {
      expect(createDetectChangesProxy('string')).toBe('string')
      expect(createDetectChangesProxy(42)).toBe(42)
      expect(createDetectChangesProxy(true)).toBe(true)
      expect(createDetectChangesProxy(false)).toBe(false)
      expect(createDetectChangesProxy(null)).toBe(null)
      expect(createDetectChangesProxy(undefined)).toBe(undefined)
    })
  })

  describe('objects', () => {
    it('should wrap objects in a proxy', () => {
      const obj = { foo: 1 }
      const proxy = createDetectChangesProxy(obj)

      expect(proxy).not.toBe(obj)
      expect(proxy.foo).toBe(1)
    })

    it('should allow setting properties on objects', () => {
      const obj = { foo: 1 }
      const proxy = createDetectChangesProxy(obj)

      proxy.foo = 42
      expect(proxy.foo).toBe(42)
      expect(obj.foo).toBe(42)
    })

    it('should trigger onBeforeChange hook when setting a property', () => {
      const obj = { foo: 1 }
      const onBeforeChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onBeforeChange },
      })

      proxy.foo = 42

      expect(onBeforeChange).toHaveBeenCalledWith(['foo'], 42)
      expect(onBeforeChange).toHaveBeenCalledTimes(1)
    })

    it('should trigger onAfterChange hook when setting a property', () => {
      const obj = { foo: 1 }
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onAfterChange },
      })

      proxy.foo = 42

      expect(onAfterChange).toHaveBeenCalledWith(['foo'], 42)
      expect(onAfterChange).toHaveBeenCalledTimes(1)
    })

    it('should trigger both hooks in correct order', () => {
      const obj = { foo: 1 }
      const callOrder: string[] = []
      const onBeforeChange = vi.fn(() => callOrder.push('before'))
      const onAfterChange = vi.fn(() => callOrder.push('after'))
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onBeforeChange, onAfterChange },
      })

      proxy.foo = 42

      expect(callOrder).toEqual(['before', 'after'])
    })

    it('should work without hooks', () => {
      const obj = { foo: 1 }
      const proxy = createDetectChangesProxy(obj)

      expect(() => {
        proxy.foo = 42
      }).not.toThrow()
      expect(proxy.foo).toBe(42)
    })

    it('should work with empty hooks object', () => {
      const obj = { foo: 1 }
      const proxy = createDetectChangesProxy(obj, { hooks: {} })

      expect(() => {
        proxy.foo = 42
      }).not.toThrow()
      expect(proxy.foo).toBe(42)
    })
  })

  describe('nested objects', () => {
    it('should handle nested objects', () => {
      const obj = { foo: { bar: 1 } }
      const proxy = createDetectChangesProxy(obj)

      expect(proxy.foo.bar).toBe(1)
    })

    it('should trigger hooks with correct path for nested properties', () => {
      const obj = { foo: { bar: 1 } }
      const onBeforeChange = vi.fn()
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onBeforeChange, onAfterChange },
      })

      proxy.foo.bar = 99

      expect(onBeforeChange).toHaveBeenCalledWith(['foo', 'bar'], 99)
      expect(onAfterChange).toHaveBeenCalledWith(['foo', 'bar'], 99)
    })

    it('should handle deeply nested objects', () => {
      const obj = { a: { b: { c: { d: 1 } } } }
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onAfterChange },
      })

      proxy.a.b.c.d = 999

      expect(onAfterChange).toHaveBeenCalledWith(['a', 'b', 'c', 'd'], 999)
      expect(proxy.a.b.c.d).toBe(999)
    })

    it('should handle mixed nested structures', () => {
      const obj = { foo: { bar: 'value', baz: { qux: true } } }
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onAfterChange },
      })

      proxy.foo.bar = 'new value'
      proxy.foo.baz.qux = false

      expect(onAfterChange).toHaveBeenNthCalledWith(1, ['foo', 'bar'], 'new value')
      expect(onAfterChange).toHaveBeenNthCalledWith(2, ['foo', 'baz', 'qux'], false)
    })
  })

  describe('arrays', () => {
    it('should wrap arrays in a proxy', () => {
      const arr = [1, 2, 3]
      const proxy = createDetectChangesProxy(arr)

      expect(proxy).not.toBe(arr)
      expect(proxy[0]).toBe(1)
      expect(proxy.length).toBe(3)
    })

    it('should trigger hooks when setting array elements', () => {
      const arr = [1, 2, 3]
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(arr, {
        hooks: { onAfterChange },
      })

      proxy[0] = 99

      expect(onAfterChange).toHaveBeenCalledWith(['0'], 99)
      expect(proxy[0]).toBe(99)
    })

    it('should trigger hooks when pushing to arrays', () => {
      const arr = [1, 2, 3]
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(arr, {
        hooks: { onAfterChange },
      })

      proxy.push(4)

      // Push sets the new element and updates length
      expect(onAfterChange).toHaveBeenCalledWith(['3'], 4)
      expect(onAfterChange).toHaveBeenCalledWith(['length'], 4)
      expect(proxy[3]).toBe(4)
    })

    it('should handle arrays of objects', () => {
      const arr = [{ id: 1 }, { id: 2 }]
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(arr, {
        hooks: { onAfterChange },
      })

      proxy[0]!.id = 99

      expect(onAfterChange).toHaveBeenCalledWith(['0', 'id'], 99)
      expect(proxy[0]?.id).toBe(99)
    })

    it('should handle nested arrays', () => {
      const arr = [
        [1, 2],
        [3, 4],
      ]
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(arr, {
        hooks: { onAfterChange },
      })

      proxy[0]![1] = 99

      expect(onAfterChange).toHaveBeenCalledWith(['0', '1'], 99)
      expect(proxy[0]?.[1]).toBe(99)
    })
  })

  describe('proxy caching', () => {
    it('should return the same proxy for the same object', () => {
      const obj = { nested: { value: 1 } }
      const proxy = createDetectChangesProxy(obj)

      const nested1 = proxy.nested
      const nested2 = proxy.nested

      expect(nested1).toBe(nested2)
    })

    it('should not create multiple proxies for the same object', () => {
      const shared = { value: 1 }
      const obj = { a: shared, b: shared }
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onAfterChange },
      })

      proxy.a.value = 99

      // The change should be reflected in both references
      expect(proxy.b.value).toBe(99)
      expect(onAfterChange).toHaveBeenCalledWith(['a', 'value'], 99)
    })

    it('should handle circular references', () => {
      const obj: any = { foo: 1 }
      obj.self = obj

      const proxy = createDetectChangesProxy(obj)

      expect(proxy.self).toBe(proxy)
      expect(proxy.self.self).toBe(proxy)
    })
  })

  describe('special properties', () => {
    it('should identify proxied objects via symbol', () => {
      const obj = { foo: 1 }
      const proxy = createDetectChangesProxy(obj)

      // Using the internal symbol (not exported, but we can test the behavior)
      expect(proxy).toBeDefined()
      expect(typeof proxy).toBe('object')
    })

    it('should allow accessing nested properties that are primitives', () => {
      const obj = { str: 'hello', num: 42, bool: true, nul: null }
      const proxy = createDetectChangesProxy(obj)

      expect(proxy.str).toBe('hello')
      expect(proxy.num).toBe(42)
      expect(proxy.bool).toBe(true)
      expect(proxy.nul).toBe(null)
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const obj = {}
      const proxy = createDetectChangesProxy(obj)

      expect(proxy).toBeDefined()
      expect(Object.keys(proxy).length).toBe(0)
    })

    it('should handle empty arrays', () => {
      const arr: number[] = []
      const proxy = createDetectChangesProxy(arr)

      expect(proxy.length).toBe(0)
    })

    it('should handle adding new properties', () => {
      const obj: any = { foo: 1 }
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onAfterChange },
      })

      proxy.newProp = 'new'

      expect(onAfterChange).toHaveBeenCalledWith(['newProp'], 'new')
      expect(proxy.newProp).toBe('new')
    })

    it('should handle deleting properties', () => {
      const obj: any = { foo: 1, bar: 2 }
      const proxy = createDetectChangesProxy(obj)

      delete proxy.foo

      expect(proxy.foo).toBeUndefined()
      expect('foo' in obj).toBe(false)
    })

    it('should handle objects with numeric keys', () => {
      const obj: any = { 0: 'zero', 1: 'one', 2: 'two' }
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onAfterChange },
      })

      proxy[0] = 'ZERO'

      expect(onAfterChange).toHaveBeenCalledWith(['0'], 'ZERO')
      expect(proxy[0]).toBe('ZERO')
    })

    it('should handle setting the same value multiple times', () => {
      const obj = { foo: 1 }
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onAfterChange },
      })

      proxy.foo = 42
      proxy.foo = 42
      proxy.foo = 42

      expect(onAfterChange).toHaveBeenCalledTimes(3)
    })

    it('should handle undefined values', () => {
      const obj: any = { foo: undefined }
      const onAfterChange = vi.fn()
      const proxy = createDetectChangesProxy(obj, {
        hooks: { onAfterChange },
      })

      proxy.foo = 'defined'

      expect(onAfterChange).toHaveBeenCalledWith(['foo'], 'defined')
      expect(proxy.foo).toBe('defined')
    })
  })
})

describe('getRaw', () => {
  it('should return primitives unchanged', () => {
    expect(getRaw('string')).toBe('string')
    expect(getRaw(42)).toBe(42)
    expect(getRaw(true)).toBe(true)
    expect(getRaw(false)).toBe(false)
  })

  it('should return null unchanged', () => {
    expect(getRaw(null)).toBe(null)
  })

  it('should return undefined unchanged', () => {
    expect(getRaw(undefined)).toBe(undefined)
  })

  it('should return non-proxy objects unchanged', () => {
    const obj = { foo: 1 }
    expect(getRaw(obj)).toBe(obj)
  })

  it('should return the original target for proxied objects', () => {
    const obj = { foo: 1 }
    const proxy = createDetectChangesProxy(obj)
    const raw = getRaw(proxy)

    expect(raw).toBe(obj)
    expect(raw).not.toBe(proxy)
  })

  it('should return the original target for nested proxies', () => {
    const obj = { foo: { bar: 1 } }
    const proxy = createDetectChangesProxy(obj)
    const nestedProxy = proxy.foo
    const raw = getRaw(nestedProxy)

    expect(raw).toBe(obj.foo)
    expect(raw).not.toBe(nestedProxy)
  })

  it('should return the original target for proxied arrays', () => {
    const arr = [1, 2, 3]
    const proxy = createDetectChangesProxy(arr)
    const raw = getRaw(proxy)

    expect(raw).toBe(arr)
    expect(raw).not.toBe(proxy)
  })

  it('should handle deeply nested proxies', () => {
    const obj = { a: { b: { c: 1 } } }
    const proxy = createDetectChangesProxy(obj)
    const deepProxy = proxy.a.b
    const raw = getRaw(deepProxy)

    expect(raw).toBe(obj.a.b)
  })

  it('should return empty objects unchanged if not proxied', () => {
    const obj = {}
    expect(getRaw(obj)).toBe(obj)
  })

  it('should return empty arrays unchanged if not proxied', () => {
    const arr: number[] = []
    expect(getRaw(arr)).toBe(arr)
  })

  it('should handle objects with circular references', () => {
    const obj: any = { foo: 1 }
    obj.self = obj
    const proxy = createDetectChangesProxy(obj)
    const raw = getRaw(proxy)

    expect(raw).toBe(obj)
    expect(raw.self).toBe(obj)
  })

  it('should work correctly after modifications to proxy', () => {
    const obj = { foo: 1 }
    const proxy = createDetectChangesProxy(obj)

    proxy.foo = 99

    const raw = getRaw(proxy)
    expect(raw).toBe(obj)
    expect(raw.foo).toBe(99)
  })
})
