import galaxy from '@scalar/galaxy/3.1.json'
import { bench, describe, expect, vi } from 'vitest'

/**
 * A minimal one-operation spec used to isolate the framework startup cost
 * from document-loading/parsing cost.
 */
const minimalSpec = {
  openapi: '3.1.0',
  info: { title: 'Minimal API', version: '1.0.0' },
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        description: 'Returns OK when the service is running.',
        responses: { '200': { description: 'OK' } },
      },
    },
  },
}

describe('standalone', () => {
  bench(
    'render minimal spec (1 operation)',
    async () => {
      vi.resetModules()
      const mountPoint = document.createElement('div')
      document.body.appendChild(mountPoint)

      const { createApiReference } = await import('@/standalone/lib/html-api')
      createApiReference(mountPoint, { content: minimalSpec })

      await vi.waitFor(() => expect(mountPoint.textContent).toContain('Health Check'))
    },
    { iterations: 1, warmupIterations: 1 },
  )

  bench(
    'render galaxy spec (first operation visible)',
    async () => {
      // We need the reset modules here otherwise they get cached, for some reason doesn't work in the beforeEach
      vi.resetModules()
      const mountPoint = document.createElement('div')
      document.body.appendChild(mountPoint)

      // We want to import in here so we include the import time in the benchmark
      const { createApiReference } = await import('@/standalone/lib/html-api')
      createApiReference(mountPoint, { content: galaxy })

      // We wait for the first operation to be rendered
      // TODO: we should option in disabling lazy loading
      await vi.waitFor(() => expect(mountPoint.textContent).toContain('Time to create a user account, eh?'))
    },
    { iterations: 1, warmupIterations: 1 },
  )
})
