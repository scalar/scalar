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

  it('defaults to system mode preference', () => {
    const { colorMode } = useColorMode()
    expect(colorMode.value).toBe('system')
  })

  it.each(['light', 'dark'] as const)('respects localStorage value: %s', (mode) => {
    localStorage.setItem('colorMode', mode)
    const { colorMode } = useColorMode()
    expect(colorMode.value).toBe(mode)
  })

  it('handles unknown localStorage values', () => {
    localStorage.setItem('colorMode', 'foobar')
    expect(() => useColorMode()).not.toThrow()
  })

  it.each(['light', 'dark'] as const)('toggles between light and dark mode when system is %s', (mode) => {
    // Mock the matchMedia to simulate system dark mode
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === `(prefers-color-scheme: ${mode})`,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { colorMode, darkLightMode, toggleColorMode } = useColorMode()
    expect(colorMode.value).toBe('system')
    expect(darkLightMode.value).toBe(mode)

    toggleColorMode()
    const inverted = mode === 'light' ? 'dark' : 'light'
    expect(colorMode.value).toBe(inverted)
    expect(darkLightMode.value).toBe(inverted)
    expect(localStorage.getItem('colorMode')).toBe(inverted)

    toggleColorMode()
    expect(colorMode.value).toBe(mode)
    expect(darkLightMode.value).toBe(mode)
    expect(localStorage.getItem('colorMode')).toBe(mode)
  })

  it('sets specific color mode', () => {
    const { colorMode, darkLightMode, setColorMode } = useColorMode()

    setColorMode('light')
    expect(colorMode.value).toBe('light')
    expect(darkLightMode.value).toBe('light')
    expect(localStorage.getItem('colorMode')).toBe('light')

    setColorMode('dark')
    expect(colorMode.value).toBe('dark')
    expect(darkLightMode.value).toBe('dark')
    expect(localStorage.getItem('colorMode')).toBe('dark')
  })

  it('allows setting colorMode via the computed ref', () => {
    const { colorMode } = useColorMode()

    colorMode.value = 'dark'
    expect(colorMode.value).toBe('dark')

    colorMode.value = 'light'
    expect(colorMode.value).toBe('light')
  })

  it.each(['light', 'dark'] as const)('isDarkMode is computed correctly when colorMode is %s', (mode) => {
    const { isDarkMode, setColorMode } = useColorMode()

    setColorMode(mode)
    expect(isDarkMode.value).toBe(mode === 'dark')
  })

  it('allows setting isDarkMode via the computed ref', () => {
    const { isDarkMode } = useColorMode()

    isDarkMode.value = true
    expect(isDarkMode.value).toBe(true)

    isDarkMode.value = false
    expect(isDarkMode.value).toBe(false)
  })

  it.each(['light', 'dark'] as const)('detects system %s mode preference', (mode) => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === `(prefers-color-scheme: ${mode})`,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { getSystemModePreference, darkLightMode } = useColorMode()
    expect(getSystemModePreference()).toBe(mode)
    expect(darkLightMode.value).toBe(mode)
  })

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

    expect(mocked.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

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

  it.each(['light', 'dark', 'system'] as const)('respects initialColorMode option: %s', (initialColorMode) => {
    const { colorMode } = useColorMode({ initialColorMode })
    expect(colorMode.value).toBe(initialColorMode)
  })

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

  it('works in SSG environment without window/document', () => {
    const originalWindow = global.window
    const originalDocument = global.document

    // Mock SSG environment by removing window/document
    // @ts-expect-error
    delete global.window
    // @ts-expect-error
    delete global.document

    const { colorMode, darkLightMode, setColorMode, toggleColorMode } = useColorMode()

    // Should default to light mode in SSG
    expect(colorMode.value).toBe('system')
    expect(darkLightMode.value).toBe('light')

    // Methods should not throw without window/document
    expect(() => setColorMode('dark')).not.toThrow()
    expect(() => toggleColorMode()).not.toThrow()

    // Restore window/document/localStorage
    global.window = originalWindow
    global.document = originalDocument
  })

  it('handles missing matchMedia gracefully', () => {
    const originalMatchMedia = window.matchMedia
    // @ts-expect-error - Intentionally removing matchMedia
    delete window.matchMedia

    const { darkLightMode } = useColorMode()
    expect(darkLightMode.value).toBe('dark') // Should default to dark when matchMedia is unavailable

    window.matchMedia = originalMatchMedia
  })
})
