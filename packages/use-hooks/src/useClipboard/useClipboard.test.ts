import { useToasts } from '@scalar/use-toasts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useClipboard } from './useClipboard'

vi.mock('@scalar/use-toasts', () => ({
  useToasts: vi.fn().mockReturnValue({
    toast: vi.fn(),
    initializeToasts: vi.fn(),
  }),
}))

describe('useClipboard', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('copies text to clipboard', async () => {
    const { copyToClipboard } = useClipboard()

    await copyToClipboard('test text')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
  })

  it('shows a toast notification when text is copied', async () => {
    const mockToast = vi.fn()
    vi.mocked(useToasts).mockReturnValue({
      toast: mockToast,
      initializeToasts: vi.fn(),
    })

    const { copyToClipboard } = useClipboard()
    await copyToClipboard('test text')

    expect(mockToast).toHaveBeenCalledWith('Copied to the clipboard', 'info')
  })

  it('calls custom notify function when provided', async () => {
    const customNotify = vi.fn()
    const { copyToClipboard } = useClipboard({ notify: customNotify })

    await copyToClipboard('test text')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
    expect(customNotify).toHaveBeenCalledWith('Copied to the clipboard')
  })

  it('handles clipboard errors gracefully', async () => {
    const mockConsole = vi.fn()
    vi.stubGlobal('console', { error: mockConsole })

    // Mock clipboard failure
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
      },
      writable: true,
    })

    const notify = vi.fn()
    const { copyToClipboard } = useClipboard({ notify })

    await copyToClipboard('test text')

    expect(notify).toHaveBeenCalledWith('Failed to copy to clipboard')
    expect(mockConsole).toHaveBeenCalledWith('Clipboard error')
  })

  it('works in SSG environment without navigator', async () => {
    const originalNavigator = global.navigator

    // Mock SSG environment by removing navigator
    // @ts-expect-error
    delete global.navigator

    const notify = vi.fn()
    const { copyToClipboard } = useClipboard({ notify })

    await copyToClipboard('test text')

    // Should show error notification since clipboard is not available
    expect(notify).toHaveBeenCalledWith('Failed to copy to clipboard')

    // Restore navigator
    global.navigator = originalNavigator
  })
})
