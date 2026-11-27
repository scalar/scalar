import { describe, expect, it, vi } from 'vitest'

import { createSharedLoader } from './create-shared-loader'

describe('create-shared-loader', () => {
  it('loads a key once for concurrent callers and caches the value', async () => {
    const load = vi.fn(async (key: string) => key.toUpperCase())
    const loader = createSharedLoader(load)

    expect(loader.get('a')).toBeUndefined()

    const [first, second] = await Promise.all([loader.load('a'), loader.load('a')])
    const third = await loader.load('a')

    expect([first, second, third]).toStrictEqual(['A', 'A', 'A'])
    expect(load).toHaveBeenCalledTimes(1)
    expect(loader.get('a')).toBe('A')
  })

  it('loads different keys separately', async () => {
    const load = vi.fn(async (key: string) => key.length)
    const loader = createSharedLoader(load)

    await Promise.all([loader.load('a'), loader.load('bb')])

    expect(load.mock.calls).toStrictEqual([['a'], ['bb']])
    expect(loader.get('bb')).toBe(2)
  })

  it('rejects every waiting caller on failure, forgets it and loads again on the next call', async () => {
    const load = vi
      .fn<(key: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('loaded')
    const loader = createSharedLoader(load)

    const results = await Promise.allSettled([loader.load('a'), loader.load('a')])

    expect(results.map((result) => result.status)).toStrictEqual(['rejected', 'rejected'])
    expect(loader.get('a')).toBeUndefined()

    await expect(loader.load('a')).resolves.toBe('loaded')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('treats a loader that throws synchronously as a failed load', async () => {
    const loader = createSharedLoader((): Promise<string> => {
      throw new Error('Broken loader')
    })

    await expect(loader.load('a')).rejects.toThrow('Broken loader')
  })

  it('starts the load on the first call, before anything awaits it', () => {
    const load = vi.fn(async () => 'value')
    const loader = createSharedLoader(load)

    void loader.load('a')

    expect(load).toHaveBeenCalledWith('a')
  })

  it('keeps values in the cache it is given', async () => {
    const cache = new Map<string, number>([['ready', 1]])
    const load = vi.fn(async () => 2)
    const loader = createSharedLoader(load, cache)

    await expect(loader.load('ready')).resolves.toBe(1)
    await loader.load('new')

    expect(load).toHaveBeenCalledTimes(1)
    expect(cache.get('new')).toBe(2)
  })
})
