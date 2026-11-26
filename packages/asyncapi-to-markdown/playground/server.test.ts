import { resolve } from 'node:path'

import { createServer } from 'vite'
import { describe, expect, it, vi } from 'vitest'

describe('server', () => {
  it('reloads the worker when renderer sources or fixtures change', async () => {
    const server = await createServer({
      root: import.meta.dirname,
      configFile: resolve(import.meta.dirname, 'vite.config.ts'),
      configLoader: 'native',
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, strictPort: true },
      optimizeDeps: { noDiscovery: true, include: [] },
    })

    try {
      await server.listen()
      const request = async (): Promise<void> => {
        const url = server.resolvedUrls!.local[0]!
        // Invalid input exercises the worker without fetching an external API description.
        const response = await fetch(`${url}__markdown/document?document=unknown`)
        expect(response.status).toBe(400)
        expect(await response.json()).toStrictEqual({ error: 'Unknown example document' })
      }

      await request()
      for (const [event, file] of [
        ['change', '../src/render-document.ts'],
        ['add', '../benchmarks/fixtures.ts'],
        ['unlink', 'service.ts'],
      ] as const) {
        const restart = vi.spyOn(server, 'restart')
        server.watcher.emit(event, resolve(import.meta.dirname, file))
        expect(restart).toHaveBeenCalledTimes(1)
        await restart.mock.results[0]!.value
        await request()
      }

      const restart = vi.spyOn(server, 'restart')
      server.watcher.emit('change', resolve(import.meta.dirname, 'src/main.ts'))
      expect(restart).not.toHaveBeenCalled()
    } finally {
      await server.close()
      vi.restoreAllMocks()
    }
  }, 30_000)
})
