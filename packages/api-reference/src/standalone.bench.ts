import { bench, describe, expect, vi } from 'vitest'

describe('standalone', () => {
  bench(
    'createApiReference load time',
    async () => {
      // This needs to be here not in a beforeEach for some reason or it doesn't reset
      vi.resetModules()
      const { createApiReference } = await import('@/standalone/lib/html-api')
      expect(createApiReference).toBeDefined()
    },
    { iterations: 1, warmupIterations: 1 },
  )
})
