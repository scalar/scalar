import galaxy from '@scalar/galaxy/3.1.json'
import { describe, expect, it, vi } from 'vitest'

describe('standalone', () => {
  it('first operation is rendered', { timeout: 30000 }, async ({ bench }) => {
    const baseline = 'test-results/standalone-benchmark.json'
    const runOptions = { iterations: 1, warmupIterations: 1 }
    const current = bench(
      'first operation is rendered',
      {
        writeResult: import.meta.env.MODE === 'benchmark-save' ? baseline : undefined,
      },
      async () => {
        // Include module loading in the measurement on every iteration.
        vi.resetModules()
        const mountPoint = document.createElement('div')
        document.body.appendChild(mountPoint)

        const { createApiReference } = await import('@/standalone/lib/html-api')
        const reference = createApiReference(mountPoint, { content: galaxy })

        try {
          await vi.waitFor(() => expect(mountPoint.textContent).toContain('Time to create a user account, eh?'))
        } finally {
          reference.destroy()
          mountPoint.remove()
        }
      },
    )

    if (import.meta.env.MODE === 'benchmark-compare') {
      await bench.compare(current, bench.from('saved baseline', baseline), runOptions)
    } else {
      await current.run(runOptions)
    }
  })
})
