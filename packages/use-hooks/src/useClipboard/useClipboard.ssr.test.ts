import { describe, expect, it, vi } from 'vitest'

import { useClipboard } from './useClipboard'

vi.mock(import('@scalar/use-toasts'), () => ({
  useToasts: () => ({ toast: vi.fn(), initializeToasts: vi.fn() }),
}))

describe('useClipboard', () => {
  it('reports a failure when the clipboard is unavailable on the server', async ({ onTestFinished }) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    onTestFinished(() => consoleError.mockRestore())
    const notify = vi.fn()
    const { copyToClipboard } = useClipboard({ notify })

    expect(typeof window).toBe('undefined')
    await copyToClipboard('test text')

    expect(notify).toHaveBeenCalledExactlyOnceWith('Failed to copy to clipboard')
    expect(consoleError).toHaveBeenCalledTimes(1)
  })
})
