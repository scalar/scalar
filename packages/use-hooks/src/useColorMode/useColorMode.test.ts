import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { useColorMode } from './useColorMode'

// Mock only onMounted, keep real nextTick
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return { ...actual, onMounted: vi.fn((fn) => fn()), onUnmounted: vi.fn() }
})

const actualMatchMedia = window.matchMedia

describe('useColorMode', () => {
  beforeEach(() => {
    // Reset the DOM
    document.body.classList.remove('dark-mode', 'light-mode')

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks()

    // Restore the original matchMedia
    window.matchMedia = actualMatchMedia
  })

  it('initializes with dark mode by default', () => {
    const { colorMode } = useColorMode()
    expect(colorMode.value).toBe('dark')
  })

  it.each(['light', 'dark'] as const)(
    'respects localStorage value: %s',
    (mode) => {
      localStorage.setItem('colorMode', mode)
      const { colorMode } = useColorMode()
      expect(colorMode.value).toBe(mode)
    },
  )

  it('handles unknown localStorage values', () => {
    localStorage.setItem('colorMode', 'foobar')
    const { colorMode } = useColorMode()
    expect(colorMode.value).toBe('dark')
  })

  it('toggles between light and dark mode', () => {
    const { colorMode, toggleColorMode } = useColorMode()
    expect(colorMode.value).toBe('dark')

    toggleColorMode()
    expect(colorMode.value).toBe('light')
    expect(localStorage.getItem('colorMode')).toBe('light')

    toggleColorMode()
    expect(colorMode.value).toBe('dark')
    expect(localStorage.getItem('colorMode')).toBe('dark')
  })

  it('sets specific color mode', () => {
    const { colorMode, setColorMode } = useColorMode()

    setColorMode('light')
    expect(colorMode.value).toBe('light')
    expect(localStorage.getItem('colorMode')).toBe('light')

    setColorMode('dark')
    expect(colorMode.value).toBe('dark')
    expect(localStorage.getItem('colorMode')).toBe('dark')
  })

  it.each(['light', 'dark'] as const)(
    'detects system %s mode preference',
    (mode) => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === `(prefers-color-scheme: ${mode})`,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const { getSystemModePreference } = useColorMode()
      expect(getSystemModePreference()).toBe(mode)
    },
  )

  it('applies correct classes to body', async () => {
    const { setColorMode } = useColorMode()

    setColorMode('dark')
    await nextTick()
    expect(document.body.classList.contains('dark-mode')).toBe(true)
    expect(document.body.classList.contains('light-mode')).toBe(false)

    setColorMode('light')
    await nextTick()
    expect(document.body.classList.contains('light-mode')).toBe(true)
    expect(document.body.classList.contains('dark-mode')).toBe(false)
  })

  it('listens to system preference changes', async () => {
    let mediaQueryCallback: () => void = () => {}

    const mockMediaQuery = (matches: boolean) => ({
      matches,
      addEventListener: vi.fn((_, callback) => (mediaQueryCallback = callback)),
      removeEventListener: vi.fn(),
    })

    // Set the mock to return false for '(prefers-color-scheme: dark)'
    const mocked = mockMediaQuery(false)
    window.matchMedia = vi.fn().mockReturnValue(mocked)

    const { setColorMode } = useColorMode()
    setColorMode('system')

    expect(mocked.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )

    await nextTick()

    expect(document.body.classList.contains('light-mode')).toBe(true)
    expect(document.body.classList.contains('dark-mode')).toBe(false)

    // Simulate system preference change
    if (mediaQueryCallback) {
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery(true))
      mediaQueryCallback()
      await nextTick()
      expect(document.body.classList.contains('light-mode')).toBe(false)
      expect(document.body.classList.contains('dark-mode')).toBe(true)
    }
  })

  it.each(['light', 'dark', 'system'] as const)(
    'respects initialColorMode option: %s',
    (initialColorMode) => {
      const { colorMode } = useColorMode({ initialColorMode })
      expect(colorMode.value).toBe(initialColorMode)
    },
  )

  it('initialColorMode is overridden by localStorage value', () => {
    localStorage.setItem('colorMode', 'dark')
    const { colorMode } = useColorMode({ initialColorMode: 'light' })
    expect(colorMode.value).toBe('dark')
  })

  it('respects overrideColorMode option', async () => {
    const { setColorMode } = useColorMode({ overrideColorMode: 'dark' })

    // Even when setting to light mode, it should stay dark due to override
    setColorMode('light')
    await nextTick()
    expect(document.body.classList.contains('dark-mode')).toBe(true)
    expect(document.body.classList.contains('light-mode')).toBe(false)

    // Should stay dark even when system preference is light
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: light)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    setColorMode('system')
    await nextTick()
    expect(document.body.classList.contains('dark-mode')).toBe(true)
    expect(document.body.classList.contains('light-mode')).toBe(false)
  })
})
