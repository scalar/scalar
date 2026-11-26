import { describe, expect, it } from 'vitest'

import { Store } from '../libs/store'
import { runInSandbox } from './sandbox'
import { createStoreWrapper } from './store-wrapper'

describe('sandbox', () => {
  it('keeps guest store writes out of the host prototype', async () => {
    const store = new Store()

    try {
      const result = await runInSandbox({
        code: `store.create('__proto__', { id: 'scalarStoreRegression', name: 'Ada' }); return store.get('__proto__', 'scalarStoreRegression')`,
        store,
      })

      expect(Object.hasOwn(Object.prototype, 'scalarStoreRegression')).toBe(false)
      expect(result).toStrictEqual({ id: 'scalarStoreRegression', name: 'Ada' })
      expect(store.list('__proto__')).toStrictEqual([result])
    } finally {
      Reflect.deleteProperty(Object.prototype, 'scalarStoreRegression')
    }
  })

  it('does not let guest store updates replace host prototype methods', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, 'toString')!

    try {
      const result = await runInSandbox({
        code: `return store.update('__proto__', 'toString', { name: 'Ada' })`,
        store: new Store(),
      })
      const actualDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, 'toString')
      // Restore the method before assertions so the test runner can format failures.
      Object.defineProperty(Object.prototype, 'toString', descriptor)
      expect(actualDescriptor).toStrictEqual(descriptor)
      expect(result).toBeNull()
    } finally {
      Object.defineProperty(Object.prototype, 'toString', descriptor)
    }
  })

  it.each([
    `store.create(['users'], { id: '1' })`,
    'store.list({})',
    'store.clear([])',
    `store.get('users', ['1'])`,
    `store.update('users', {}, { name: 'Ada' })`,
    `store.delete('users', ['1'])`,
    `store.create('users', { id: ['1'] })`,
  ])('rejects non-primitive store keys in %s', async (code) => {
    const store = new Store()
    store.create('users', { id: '1', name: 'Alan' })

    await expect(runInSandbox({ code, store })).rejects.toThrow(/store:/)
    expect(store.list('users')).toStrictEqual([{ id: '1', name: 'Alan' }])
  })

  it('preserves numeric item IDs through the store bridge', async () => {
    const result = await runInSandbox({
      code: `store.create('users', { id: 1, name: 'Ada' }); return store.get('users', 1)`,
      store: new Store(),
    })

    expect(result).toStrictEqual({ id: 1, name: 'Ada' })
  })

  describe('escape attempts', () => {
    it('has no access to host globals', async () => {
      const result = await runInSandbox({
        code: `return {
          process: typeof process,
          require: typeof require,
          fetch: typeof fetch,
          global: typeof global,
          globalThis: typeof globalThis.process,
        }`,
        store: new Store(),
      })

      expect(result).toEqual({
        process: 'undefined',
        require: 'undefined',
        fetch: 'undefined',
        global: 'undefined',
        globalThis: 'undefined',
      })
    })

    it('cannot reach the host through the Function constructor', async () => {
      // Even if guest code builds a fresh function, the host runtime is not reachable
      // from inside the WebAssembly guest, so `process` is still undefined.
      const result = await runInSandbox({
        code: `return this.constructor.constructor('return typeof process')()`,
        store: new Store(),
      })

      expect(result).toBe('undefined')
    })

    it('cannot pollute host prototypes', async () => {
      await runInSandbox({
        code: `Object.prototype.polluted = 'yes'; return 1`,
        store: new Store(),
      })

      expect({} as Record<string, unknown>).not.toHaveProperty('polluted')
    })

    it('rejects dangerous property paths on the faker bridge', async () => {
      await expect(
        runInSandbox({
          code: `return faker.constructor('return 1')`,
          store: new Store(),
        }),
      ).rejects.toThrow(/not accessible/)

      await expect(
        runInSandbox({
          code: `return faker.string.__proto__.constructor('return 1')`,
          store: new Store(),
        }),
      ).rejects.toThrow(/not accessible/)
    })
  })

  describe('resource limits', () => {
    it('enforces the memory limit', async () => {
      await expect(
        runInSandbox({
          code: 'return new Array(100_000_000).fill(0).length',
          store: new Store(),
        }),
      ).rejects.toThrow()
    })

    it('enforces the time limit on an infinite loop', async () => {
      await expect(
        runInSandbox({
          code: 'while (true) {}',
          store: new Store(),
        }),
      ).rejects.toThrow()
    })
  })

  describe('bridges', () => {
    it('exposes faker', async () => {
      const uuid = await runInSandbox({
        code: 'return faker.string.uuid()',
        store: new Store(),
      })

      expect(uuid).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('surfaces a helpful error for unknown faker methods', async () => {
      await expect(
        runInSandbox({
          code: 'return faker.not.real()',
          store: new Store(),
        }),
      ).rejects.toThrow(/faker/)
    })

    it('reads the injected req and res inputs', async () => {
      const result = await runInSandbox({
        code: `return { name: req.query.name, status: res['200'] }`,
        store: new Store(),
        jsonGlobals: { req: { query: { name: 'scalar' } }, res: { '200': { ok: true } } },
      })

      expect(result).toEqual({ name: 'scalar', status: { ok: true } })
    })

    it('creates and lists items through the store bridge', async () => {
      const store = new Store()

      const items = await runInSandbox({
        code: `store.create('users', { name: 'Ada' }); return store.list('users')`,
        store,
      })

      expect(items).toHaveLength(1)
      expect(items).toMatchObject([{ name: 'Ada' }])
      expect(store.list('users')).toHaveLength(1)
    })

    it('records store operations on the tracked wrapper', async () => {
      const { wrappedStore, tracking } = createStoreWrapper(new Store())

      await runInSandbox({
        code: `store.create('users', { name: 'Ada' }); return null`,
        store: wrappedStore,
      })

      expect(tracking.operations.map((operation) => operation.operation)).toContain('create')
    })

    it('awaits promises returned from handler code', async () => {
      const result = await runInSandbox({
        code: 'const value = await Promise.resolve(42); return value',
        store: new Store(),
      })

      expect(result).toBe(42)
    })
  })

  describe('seed helper', () => {
    it('creates a single item from a factory', async () => {
      const store = new Store()

      await runInSandbox({
        code: 'seed(() => ({ name: faker.person.fullName() }))',
        store,
        jsonGlobals: { schema: 'people' },
        includeSeed: true,
      })

      expect(store.list('people')).toHaveLength(1)
    })

    it('creates many items with seed.count', async () => {
      const store = new Store()

      await runInSandbox({
        code: 'seed.count(3, () => ({ id: faker.string.uuid() }))',
        store,
        jsonGlobals: { schema: 'people' },
        includeSeed: true,
      })

      expect(store.list('people')).toHaveLength(3)
    })

    it('creates items from an array', async () => {
      const store = new Store()

      await runInSandbox({
        code: `seed([{ name: 'Ada' }, { name: 'Alan' }])`,
        store,
        jsonGlobals: { schema: 'people' },
        includeSeed: true,
      })

      expect(store.list('people')).toHaveLength(2)
    })
  })
})
