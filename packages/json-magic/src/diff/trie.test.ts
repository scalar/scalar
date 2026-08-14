import { afterEach, describe, expect, test, vi } from 'vitest'

import { Trie } from '@/diff/trie'

describe('trie', () => {
  test('should correctly find matched', () => {
    const trie = new Trie<number>()

    trie.addPath(['a', 'b', 'c'], 1)
    trie.addPath(['a', 'b', 'd'], 2)
    trie.addPath(['a', 'b', 'c', 'd'], 3)
    trie.addPath(['a', 'b', 'c', 'd', 'e', 'f'], 4)
    trie.addPath(['a', 'b'], 5)

    /**
     * created trie:
     *
     * (a, null) -> (b, 5) -> (c, 1) -> (d, 3) -> (e, null) -> (f, 4)
     *          \-> (d, 2)
     */

    const fn = vi.fn()
    trie.findMatch(['a', 'b', 'c'], fn)

    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenNthCalledWith(1, 5)
    expect(fn).toHaveBeenNthCalledWith(2, 4)
    expect(fn).toHaveBeenNthCalledWith(3, 3)
    expect(fn).toHaveBeenNthCalledWith(4, 1)
  })

  describe('prototype pollution', () => {
    // A regression writes onto `Object.prototype`, where it would leak into every later test in the
    // worker and turn one failure into many. Clean it up so failures stay readable.
    afterEach(() => {
      // A `__proto__` regression writes onto `Object.prototype`, a `constructor` regression writes
      // onto the global `Object` itself, so both need clearing
      delete (Object.prototype as Record<string, unknown>).value
      delete (Object as unknown as Record<string, unknown>).value
    })

    test('stores a `__proto__` segment as a real child instead of writing to the prototype', () => {
      const trie = new Trie<number>()

      trie.addPath(['__proto__'], 1)

      expect(({} as Record<string, unknown>).value).toBeUndefined()

      const fn = vi.fn()
      trie.findMatch(['__proto__'], fn)

      expect(fn).toHaveBeenCalledExactlyOnceWith(1)
    })

    test('walks past a `__proto__` segment without crashing', () => {
      const trie = new Trie<number>()

      trie.addPath(['__proto__', 'polluted'], 1)

      expect(({} as Record<string, unknown>).value).toBeUndefined()

      const fn = vi.fn()
      trie.findMatch(['__proto__', 'polluted'], fn)

      expect(fn).toHaveBeenCalledExactlyOnceWith(1)
    })

    test('keeps a `constructor` segment off the global constructor', () => {
      const trie = new Trie<number>()

      trie.addPath(['constructor'], 1)

      expect((Object as unknown as Record<string, unknown>).value).toBeUndefined()

      const fn = vi.fn()
      trie.findMatch(['constructor'], fn)

      expect(fn).toHaveBeenCalledExactlyOnceWith(1)
    })
  })
})
