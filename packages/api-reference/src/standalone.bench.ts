import galaxy from '@scalar/galaxy/3.1.json'
import { waitFor } from '@test/utils/wait-for'
import { bench, describe, vi } from 'vitest'

describe('standalone', () => {
  bench(
    'time until first operation is rendered',
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
      await waitFor(() => mountPoint.textContent?.includes('Time to create a user account, eh?') ?? false)
    },
    { iterations: 1, warmupIterations: 1 },
  )
})
