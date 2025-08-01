import { Trie } from '@/diff/trie'
import { describe, expect, test, vi } from 'vitest'

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
})
