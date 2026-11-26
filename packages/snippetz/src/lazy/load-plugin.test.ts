import type { Plugin } from '@scalar/types/snippetz'
import { describe, expect, it, vi } from 'vitest'

import { snippetz } from '@/snippetz'

import { createLazyPlugins, getLoadedPlugin, hasPlugin, loadPlugin, preloadClients, print } from './load-plugin'

const makePlugin = (title: string): Plugin => ({
  target: 'shell',
  client: 'curl',
  title,
  generate: () => title,
})

describe('load-plugin', () => {
  describe('createLazyPlugins', () => {
    it('imports once for concurrent loads of the same plugin', async () => {
      const plugin = makePlugin('cURL')
      const loader = vi.fn(() => Promise.resolve(plugin))
      const lazy = createLazyPlugins({ 'shell/curl': loader })

      const results = await Promise.all([
        lazy.loadPlugin('shell', 'curl'),
        lazy.loadPlugin('shell', 'curl'),
        lazy.loadPlugin('shell', 'curl'),
      ])

      expect(loader).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual([plugin, plugin, plugin])
    })

    it('retries after a rejected import', async () => {
      const plugin = makePlugin('cURL')
      const loader = vi
        .fn<() => Promise<Plugin>>()
        .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))
        .mockResolvedValueOnce(plugin)
      const lazy = createLazyPlugins({ 'shell/curl': loader })

      await expect(lazy.loadPlugin('shell', 'curl')).rejects.toThrow('Failed to fetch dynamically imported module')
      expect(lazy.getLoadedPlugin('shell', 'curl')).toBeUndefined()

      await expect(lazy.loadPlugin('shell', 'curl')).resolves.toBe(plugin)
      expect(loader).toHaveBeenCalledTimes(2)
    })

    it('resolves an already loaded plugin without importing it again', async () => {
      const plugin = makePlugin('cURL')
      const loader = vi.fn(() => Promise.resolve(plugin))
      const lazy = createLazyPlugins({ 'shell/curl': loader })

      expect(lazy.getLoadedPlugin('shell', 'curl')).toBeUndefined()
      await lazy.loadPlugin('shell', 'curl')
      expect(lazy.getLoadedPlugin('shell', 'curl')).toBe(plugin)

      await expect(lazy.loadPlugin('shell', 'curl')).resolves.toBe(plugin)
      expect(loader).toHaveBeenCalledTimes(1)
    })

    it('resolves undefined for unknown clients', async () => {
      const lazy = createLazyPlugins({})

      await expect(lazy.loadPlugin('shell', 'fantasy')).resolves.toBeUndefined()
      await expect(lazy.loadPlugin('constructor', '')).resolves.toBeUndefined()
      expect(lazy.hasPlugin('shell', 'fantasy')).toBe(false)
    })

    it('preloads only the requested built-in clients', async () => {
      const curl = vi.fn(() => Promise.resolve(makePlugin('cURL')))
      const wget = vi.fn(() => Promise.resolve(makePlugin('Wget')))
      const lazy = createLazyPlugins({ 'shell/curl': curl, 'shell/wget': wget })

      await lazy.preloadClients(['shell/curl', 'custom/python', 'shell/fantasy'])

      expect(curl).toHaveBeenCalledTimes(1)
      expect(wget).not.toHaveBeenCalled()
      expect(lazy.getLoadedPlugin('shell', 'curl')?.title).toBe('cURL')
    })

    it('waits for every client and resolves when one of them fails to load', async () => {
      let releaseWget: () => void = () => undefined
      const curl = vi.fn(() => Promise.reject(new Error('Failed to fetch dynamically imported module')))
      const wget = vi.fn(
        () =>
          new Promise<Plugin>((resolve) => {
            releaseWget = () => resolve(makePlugin('Wget'))
          }),
      )
      const lazy = createLazyPlugins({ 'shell/curl': curl, 'shell/wget': wget })

      let settled = false
      const preload = lazy.preloadClients(['shell/curl', 'shell/wget']).then(() => {
        settled = true
      })
      await Promise.resolve()
      // The failed curl import must not end the wait while wget is still loading
      expect(settled).toBe(false)

      releaseWget()
      await expect(preload).resolves.toBeUndefined()
      expect(lazy.getLoadedPlugin('shell', 'curl')).toBeUndefined()
      expect(lazy.getLoadedPlugin('shell', 'wget')?.title).toBe('Wget')
    })
  })

  describe('default loaders', () => {
    it('loads a real plugin on demand', async () => {
      expect(hasPlugin('node', 'undici')).toBe(true)

      const plugin = await loadPlugin('node', 'undici')

      expect(plugin).toBe(snippetz().findPlugin('node', 'undici'))
      expect(getLoadedPlugin('node', 'undici')).toBe(plugin)
    })

    it('prints the same snippet as snippetz()', async () => {
      const request = { url: 'https://example.com', method: 'POST' }

      expect(await print('python', 'requests', request)).toBe(snippetz().print('python', 'requests', request))
      expect(await print('python', 'fantasy' as 'requests', request)).toBeUndefined()
    })

    it('preloads clients for synchronous access', async () => {
      await preloadClients(['shell/wget', 'js/axios'])

      expect(getLoadedPlugin('shell', 'wget')?.title).toBe('Wget')
      expect(getLoadedPlugin('js', 'axios')?.title).toBe('Axios')
    })
  })
})
