import { describe, expect, it, vi } from 'vitest'

import { useDarkModeState } from './useDarkModeState'

describe('useDarkModeState', () => {
  it('works with light mode as the system setting', async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
    })

    const { isDark } = useDarkModeState()

    expect(isDark.value).toBe(false)
  })

  it('sets dark mode initially', async () => {
    const { isDark } = useDarkModeState(true)

    expect(isDark.value).toBe(true)
  })

  it('toggles the dark mode', async () => {
    const { isDark, toggleDarkMode } = useDarkModeState()

    expect(isDark.value).toBe(false)

    toggleDarkMode()
    expect(isDark.value).toBe(true)
  })

  it('sets the dark mode', async () => {
    const { isDark, setDarkMode } = useDarkModeState()

    expect(isDark.value).toBe(true)

    setDarkMode(false)
    expect(isDark.value).toBe(false)
  })

  it('forces light mode', async () => {
    const { isDark } = useDarkModeState(undefined, 'light')

    expect(isDark.value).toBe(false)
  })

  it('forces dark mode', async () => {
    const { isDark } = useDarkModeState(undefined, 'dark')

    expect(isDark.value).toBe(true)
  })
})
