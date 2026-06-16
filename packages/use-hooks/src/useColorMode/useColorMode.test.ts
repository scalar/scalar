import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, onMounted } from 'vue'

import { useColorMode } from './useColorMode'

// Mock only onMounted, keep real nextTick
vi.mock(import('vue'), async (importOriginal) => ({
  ...(await importOriginal()),
  onMounted: vi.fn((fn) => fn()),
  onUnmounted: vi.fn(),
}))

const createMatchMediaMock = (mode: 'light' | 'dark' = 'dark'): (() => MediaQueryList) => {
  const mediaQueryListMock: Partial<MediaQueryList> = {
    matches: mode === 'dark',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  return () => mediaQueryListMock as MediaQueryList
}

describe('useColorMode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    // Reset the DOM
    document.body.classList.remove('dark-mode', 'light-mode')

    // Clear localStorage
    localStorage.clear()

    // Provide a default matchMedia mock since jsdom does not implement it
    window.matchMedia = vi.fn().mockImplementation(createMatchMediaMock('light'))

    // `systemPreference` is shared module state, so reset it to a fresh `'light'` baseline before
    // each test. A throwaway hook resolves it via the immediate (mocked) `onMounted` above.
    useColorMode()
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
    vi.spyOn(window, 'matchMedia').mockImplementation(createMatchMediaMock(mode))

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
    vi.spyOn(window, 'matchMedia').mockImplementation(createMatchMediaMock(mode))

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
    const matchMediaSpy = vi.spyOn(window, 'matchMedia')

    let mediaQueryCallback: () => void = vi.fn()

    const createMediaQueryListMock = (mode: 'light' | 'dark') => ({
      // need to generate the mediaQueryList right away to update addEventListener
      ...createMatchMediaMock(mode)(),
      addEventListener: vi.fn((_, callback) => (mediaQueryCallback = callback)),
    })

    // Set the mock to return false for '(prefers-color-scheme: dark)'
    const mocked = createMediaQueryListMock('light')
    matchMediaSpy.mockImplementation(() => mocked)

    const { setColorMode } = useColorMode()
    setColorMode('system')

    expect(mocked.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    await nextTick()

    expect(document.body.classList.contains('light-mode')).toBe(true)
    expect(document.body.classList.contains('dark-mode')).toBe(false)

    // Simulate system preference change
    matchMediaSpy.mockImplementation(() => createMediaQueryListMock('dark'))
    mediaQueryCallback()
    await nextTick()
    expect(document.body.classList.contains('light-mode')).toBe(false)
    expect(document.body.classList.contains('dark-mode')).toBe(true)
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
    vi.spyOn(window, 'matchMedia').mockImplementation(createMatchMediaMock('light'))

    setColorMode('system')
    await nextTick()
    expect(document.body.classList.contains('dark-mode')).toBe(true)
    expect(document.body.classList.contains('light-mode')).toBe(false)
  })

  it('works in SSG environment without window/document', ({ onTestFinished }) => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    onTestFinished(() => {
      vi.unstubAllGlobals()
    })

    const { colorMode, darkLightMode, setColorMode, toggleColorMode } = useColorMode()

    // Should default to light mode in SSG
    expect(colorMode.value).toBe('system')
    expect(darkLightMode.value).toBe('light')

    // Methods should not throw without window/document
    expect(() => setColorMode('dark')).not.toThrow()
    expect(() => toggleColorMode()).not.toThrow()
  })

  it('uses system mode on SSG even when initialColorMode is set', ({ onTestFinished }) => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    onTestFinished(() => {
      vi.unstubAllGlobals()
    })

    const { colorMode } = useColorMode({ initialColorMode: 'dark' })
    expect(colorMode.value).toBe('system')
  })

  it('defers the system preference to onMounted to stay hydration-safe', async () => {
    // A dark system preference that, like the real one, only exists on the client.
    vi.spyOn(window, 'matchMedia').mockImplementation(createMatchMediaMock('dark'))

    // Capture the onMounted callback instead of running it right away, so we can
    // inspect the pre-mount render that has to match the server.
    let mountedCallback: (() => void) | undefined
    vi.mocked(onMounted).mockImplementationOnce((fn) => {
      mountedCallback = fn as () => void
    })

    const { darkLightMode } = useColorMode()

    // Before mount it matches the server default, not the dark system preference.
    expect(darkLightMode.value).toBe('light')

    // After mount it upgrades to the real system preference.
    mountedCallback?.()
    await nextTick()
    expect(darkLightMode.value).toBe('dark')
  })

  it('keeps the body class aligned with the toggle before mount', async () => {
    // A dark system preference that only exists on the client (resolved in onMounted).
    vi.spyOn(window, 'matchMedia').mockImplementation(createMatchMediaMock('dark'))

    // Defer the mount so we can inspect the pre-mount render that has to match the server.
    let mountedCallback: (() => void) | undefined
    vi.mocked(onMounted).mockImplementationOnce((fn) => {
      mountedCallback = fn as () => void
    })

    const { darkLightMode } = useColorMode()
    await nextTick()

    // Before mount the body must agree with the light toggle, not the dark system preference.
    expect(darkLightMode.value).toBe('light')
    expect(document.body.classList.contains('light-mode')).toBe(true)
    expect(document.body.classList.contains('dark-mode')).toBe(false)

    // After mount the body and the toggle upgrade to the real preference together.
    mountedCallback?.()
    await nextTick()
    expect(darkLightMode.value).toBe('dark')
    expect(document.body.classList.contains('dark-mode')).toBe(true)
    expect(document.body.classList.contains('light-mode')).toBe(false)
  })

  it('shares the resolved system preference across instances', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(createMatchMediaMock('dark'))

    // The first instance never mounts, so it still reports the server default on its own.
    vi.mocked(onMounted).mockImplementationOnce(() => {})
    const first = useColorMode()
    expect(first.darkLightMode.value).toBe('light')

    // A second instance mounts and resolves the real (dark) preference.
    const second = useColorMode()
    await nextTick()

    // Because the preference is shared, the still-unmounted first instance agrees immediately.
    expect(second.darkLightMode.value).toBe('dark')
    expect(first.darkLightMode.value).toBe('dark')
  })

  it('handles missing matchMedia gracefully', ({ onTestFinished }) => {
    vi.stubGlobal('matchMedia', undefined)

    onTestFinished(() => {
      vi.unstubAllGlobals()
    })

    const { darkLightMode } = useColorMode()
    expect(darkLightMode.value).toBe('dark') // Should default to dark when matchMedia is unavailable
  })
})
