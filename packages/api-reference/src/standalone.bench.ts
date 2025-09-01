import galaxy from '@scalar/galaxy/3.1.json'
import { waitFor } from '@test/utils/wait-for'
import { bench, describe, vi } from 'vitest'

describe('standalone', () => {
  bench(
    'time until first operation is rendered',
    async () => {
      vi.resetModules()
      const mountPoint = document.createElement('div')
      document.body.appendChild(mountPoint)
      const { createApiReference } = await import('@/standalone/lib/html-api')

      createApiReference(mountPoint, { content: galaxy })

      await waitFor(() => mountPoint.textContent?.includes('Time to create a user account, eh?') ?? false)
    },
    { iterations: 1, warmupIterations: 1 },
  )
})
