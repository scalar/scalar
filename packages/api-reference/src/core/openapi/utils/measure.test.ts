import { describe, expect, it, vi } from 'vitest'

import { measure } from './measure'

describe('measure', () => {
  it('outputs something to the console', async () => {
    const consoleSpy = vi.spyOn(console, 'log')

    await measure('some-heavy-lifting', () => {
      return new Promise((resolve) => setTimeout(resolve, 10))
    })

    // some-heavy-lifting: 10 ms

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/some-heavy-lifting: (8|9|10|11|12) ms/),
    )

    consoleSpy.mockRestore()
  })
})
