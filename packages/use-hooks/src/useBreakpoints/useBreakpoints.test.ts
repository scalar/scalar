import { useMediaQuery } from '@vueuse/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref, toValue } from 'vue'

import { screens } from './constants'
import { useBreakpoints } from './useBreakpoints'

vi.mock('@vueuse/core', () => ({
  useMediaQuery: vi.fn(),
}))

describe('useBreakpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should expose the screen sizes', () => {
    const { screens: exposedScreens } = useBreakpoints()
    expect(exposedScreens).toEqual(screens)
  })

  it('should expose media queries for a given screen size', () => {
    vi.mocked(useMediaQuery).mockImplementation((query) => computed(() => toValue(query) === screens.md))

    const { mediaQueries } = useBreakpoints()
    expect(mediaQueries.sm.value).toEqual(false)
    expect(mediaQueries.md.value).toEqual(true)
  })

  it('should update breakpoints when the media query changes', () => {
    const mdQuery = ref(false)

    vi.mocked(useMediaQuery).mockImplementation((_query) => computed(() => mdQuery.value))

    const { breakpoints } = useBreakpoints()

    expect(breakpoints.value.md).toEqual(false)

    mdQuery.value = true

    expect(breakpoints.value.md).toEqual(true)
  })

  it('works in SSG environment without window', () => {
    const originalWindow = global.window

    // Mock SSG environment by removing window
    // @ts-expect-error
    delete global.window

    // Mock useMediaQuery to return false since there's no window
    vi.mocked(useMediaQuery).mockImplementation(() => computed(() => false))

    const { screens: exposedScreens, mediaQueries, breakpoints } = useBreakpoints()

    // Screens should still be exposed since they're static
    expect(exposedScreens).toEqual(screens)

    // Media queries should all be false without window
    Object.values(mediaQueries).forEach((query) => {
      expect(query.value).toBe(false)
    })

    // Breakpoints should all be false without window
    Object.values(breakpoints.value).forEach((value) => {
      expect(value).toBe(false)
    })

    // Restore window
    global.window = originalWindow
  })
})
