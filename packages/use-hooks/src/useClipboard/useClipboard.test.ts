import { useToasts } from '@scalar/use-toasts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useClipboard } from './useClipboard'

vi.mock(import('@scalar/use-toasts'), () => ({
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

  it('works in SSG environment without navigator', async ({ onTestFinished }) => {
    // Mock SSG environment by removing navigator
    vi.stubGlobal('navigator', undefined)
    onTestFinished(() => {
      vi.unstubAllGlobals()
    })

    const notify = vi.fn()
    const { copyToClipboard } = useClipboard({ notify })

    await copyToClipboard('test text')

    // Should show error notification since clipboard is not available
    expect(notify).toHaveBeenCalledWith('Failed to copy to clipboard')
  })

  it('handles objects by stringifying them', async () => {
    const { copyToClipboard } = useClipboard()
    const testObject = { name: 'John', age: 30 }

    await copyToClipboard(testObject)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(testObject))
  })

  it('handles arrays by stringifying them', async () => {
    const { copyToClipboard } = useClipboard()
    const testArray = [1, 2, 3, 'four']

    await copyToClipboard(testArray)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(testArray))
  })

  it('handles numbers by stringifying them', async () => {
    const { copyToClipboard } = useClipboard()

    await copyToClipboard(42)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('42')
  })

  it('handles booleans by stringifying them', async () => {
    const { copyToClipboard } = useClipboard()

    await copyToClipboard(true)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('true')
  })

  it('handles null by stringifying it', async () => {
    const { copyToClipboard } = useClipboard()

    await copyToClipboard(null)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('null')
  })

  it('handles undefined by stringifying it', async () => {
    const { copyToClipboard } = useClipboard()
    await copyToClipboard(undefined)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('undefined')
  })

  it('handles nested objects by stringifying them', async () => {
    const { copyToClipboard } = useClipboard()
    const nestedObject = {
      user: {
        name: 'Jane',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      },
      items: [1, 2, 3],
    }

    await copyToClipboard(nestedObject)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(nestedObject))
  })
})
