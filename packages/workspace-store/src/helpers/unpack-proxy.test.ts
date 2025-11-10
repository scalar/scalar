import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

import { createDetectChangesProxy } from '@/helpers/detect-changes-proxy'
import { createOverridesProxy } from '@/helpers/overrides-proxy'

import { unpackProxyObject } from './unpack-proxy'

describe('unpackProxyObject', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // Mock implementation - do nothing
    })
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('primitives', () => {
    it('should return primitives unchanged', () => {
      expect(unpackProxyObject('string')).toBe('string')
      expect(unpackProxyObject(42)).toBe(42)
      expect(unpackProxyObject(true)).toBe(true)
      expect(unpackProxyObject(false)).toBe(false)
      expect(unpackProxyObject(null)).toBe(null)
      expect(unpackProxyObject(undefined)).toBe(undefined)
    })
  })

  describe('plain objects and arrays', () => {
    it('should return plain objects unchanged', () => {
      const obj = { foo: 1, bar: { baz: 2 } }
      const result = unpackProxyObject(obj)
      expect(result).toBe(obj)
      expect(result).toEqual({ foo: 1, bar: { baz: 2 } })
    })

    it('should return plain arrays unchanged', () => {
      const arr = [1, 2, 3]
      const result = unpackProxyObject(arr)
      expect(result).toBe(arr)
      expect(result).toEqual([1, 2, 3])
    })

    it('should return empty objects unchanged', () => {
      const obj = {}
      const result = unpackProxyObject(obj)
      expect(result).toBe(obj)
    })

    it('should return empty arrays unchanged', () => {
      const arr: number[] = []
      const result = unpackProxyObject(arr)
      expect(result).toBe(arr)
    })
  })

  describe('Vue reactivity proxies', () => {
    it('should unpack Vue reactive objects', () => {
      const original = { foo: 1, bar: { baz: 2 } }
      const reactiveObj = reactive(original)
      const result = unpackProxyObject(reactiveObj)

      expect(result).not.toBe(reactiveObj)
      expect(result).toEqual(original)
      expect(result).toBe(original)
    })

    it('should unpack nested Vue reactive objects', () => {
      const original = { foo: { bar: { baz: 1 } } }
      const reactiveObj = reactive(original)
      const result = unpackProxyObject(reactiveObj)

      expect(result).toEqual(original)
      expect(result.foo).toBe(original.foo)
      expect(result.foo.bar).toBe(original.foo.bar)
    })

    it('should unpack Vue reactive arrays', () => {
      const original = [1, 2, 3]
      const reactiveArr = reactive(original)
      const result = unpackProxyObject(reactiveArr)

      expect(result).not.toBe(reactiveArr)
      expect(result).toEqual(original)
      expect(result).toBe(original)
    })
  })

  describe('detect-changes proxies', () => {
    it('should unpack detect-changes proxy objects', () => {
      const original = { foo: 1, bar: { baz: 2 } }
      const proxy = createDetectChangesProxy(original)
      const result = unpackProxyObject(proxy)

      expect(result).not.toBe(proxy)
      expect(result).toEqual(original)
      expect(result).toBe(original)
    })

    it('should unpack nested detect-changes proxy objects', () => {
      const original = { foo: { bar: { baz: 1 } } }
      const proxy = createDetectChangesProxy(original)
      const result = unpackProxyObject(proxy)

      expect(result).toEqual(original)
      expect(result.foo).toBe(original.foo)
      expect(result.foo.bar).toBe(original.foo.bar)
    })

    it('should unpack detect-changes proxy arrays', () => {
      const original = [1, 2, 3]
      const proxy = createDetectChangesProxy(original)
      const result = unpackProxyObject(proxy)

      expect(result).not.toBe(proxy)
      expect(result).toEqual(original)
      expect(result).toBe(original)
    })
  })

  describe('overrides proxies', () => {
    it('should unpack overrides proxy objects', () => {
      const original = { foo: 1, bar: { baz: 2 } }
      const overrides = { foo: 3 }
      const proxy = createOverridesProxy(original, { overrides })
      const result = unpackProxyObject(proxy)

      expect(result).not.toBe(proxy)
      expect(result).toEqual(original)
      expect(result).toBe(original)
    })

    it('should unpack nested overrides proxy objects', () => {
      const original = { foo: { bar: { baz: 1 } } }
      const overrides = { foo: { bar: { baz: 2 } } }
      const proxy = createOverridesProxy(original, { overrides })
      const result = unpackProxyObject(proxy)

      expect(result).toEqual(original)
      expect(result.foo).toBe(original.foo)
      expect(result.foo.bar).toBe(original.foo.bar)
    })
  })

  describe('magic proxies', () => {
    it('should unpack magic proxy objects', () => {
      const original = { foo: 1, bar: { baz: 2 } }
      const proxy = createMagicProxy(original)
      const result = unpackProxyObject(proxy)

      expect(result).toEqual(original)
      expect(result).toBe(original)
    })

    it('should unpack nested magic proxy objects', () => {
      const original = { foo: { bar: { baz: 1 } } }
      const proxy = createMagicProxy(original)
      const result = unpackProxyObject(proxy)

      expect(result).toEqual(original)
      expect(result.foo).toBe(original.foo)
      expect(result.foo.bar).toBe(original.foo.bar)
    })
  })

  describe('combined proxies', () => {
    it('should unpack Vue reactive + detect-changes proxy', () => {
      const original = { foo: 1 }
      const reactiveObj = reactive(original)
      const detectChangesProxy = createDetectChangesProxy(reactiveObj)
      const result = unpackProxyObject(detectChangesProxy)

      expect(result).toEqual(original)
      expect(result).toBe(original)
    })

    it('should unpack Vue reactive + overrides proxy', () => {
      const original = { foo: 1, bar: 2 }
      const overrides = { foo: 3 }
      const reactiveObj = reactive(original)
      const overridesProxy = createOverridesProxy(reactiveObj, { overrides })
      const result = unpackProxyObject(overridesProxy)

      expect(result).toEqual(original)
      expect(result).toBe(original)
    })

    it('should unpack all proxy types combined', () => {
      const original = { foo: 1, bar: { baz: 2 } }
      const reactiveObj = reactive(original)
      const overrides = { bar: { baz: 3 } }
      const overridesProxy = createOverridesProxy(reactiveObj, { overrides })
      const magicProxy = createMagicProxy(overridesProxy)
      const detectChangesProxy = createDetectChangesProxy(magicProxy)
      const result = unpackProxyObject(detectChangesProxy)

      expect(result).toEqual(original)
      expect(result).toBe(original)
    })
  })

  describe('depth limiting', () => {
    it('should respect depth limit of 0', () => {
      const proxy = createDetectChangesProxy({ foo: { bar: { baz: 1 } } })
      const proxy2 = createDetectChangesProxy({ test: 1 })
      const original = { foo: { proxy, bar: proxy2 } }
      const reactiveObj = reactive(original)
      const result = unpackProxyObject(reactiveObj, { depth: 0 })

      expect(result).toBe(original)
      expect(result.foo.proxy).toBe(proxy)
      expect(result.foo.bar).toBe(proxy2)
    })

    it('should respect depth limit of 1', () => {
      const proxy = createDetectChangesProxy({ foo: { bar: { baz: 1 } } })
      const proxy2 = createDetectChangesProxy({ test: 1 })
      const original = { foo: proxy, bar: { proxy: proxy2 } }
      const reactiveObj = reactive(original)
      const result = unpackProxyObject(reactiveObj, { depth: 1 })

      expect(result).toBe(original)
      expect(result.foo).not.toBe(proxy)
      expect(result.bar.proxy).toBe(proxy2)
    })

    it('should handle unlimited depth when depth is null', () => {
      const proxy = createDetectChangesProxy({ foo: { bar: { baz: 1 } } })
      const proxy2 = createDetectChangesProxy({ test: 1 })
      const original = { foo: { proxy, bar: proxy2 } }
      const reactiveObj = reactive(original)
      const result = unpackProxyObject(reactiveObj, { depth: null })

      expect(result).toBe(original)
      expect(result.foo.proxy).not.toBe(proxy)
      expect(result.foo.bar).not.toBe(proxy2)
    })
  })

  it('does work when we have a circular reference inside the magic proxy', () => {
    const input = {
      a: {
        b: {
          c: {
            $ref: '#/a',
          },
        },
      },
    }

    expect(unpackProxyObject(createMagicProxy(input))).toEqual(input)
  })
})
