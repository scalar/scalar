import preset from '@scalar/themes/tailwind'
import { useMediaQuery } from '@vueuse/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useBreakpoints } from './useBreakpoints'

const screens = preset.theme.screens

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
    vi.mocked(useMediaQuery).mockImplementation((query) =>
      ref(query === `(min-width: ${screens.md})`),
    )

    const { mediaQueries } = useBreakpoints()
    expect(mediaQueries.sm.value).toEqual(false)
    expect(mediaQueries.md.value).toEqual(true)
  })

  it('should expose breakpoints for a given screen size', () => {
    vi.mocked(useMediaQuery).mockImplementation((query) =>
      ref(query === `(min-width: ${screens.md})`),
    )

    const { breakpoints } = useBreakpoints()
    expect(breakpoints.value.sm).toEqual(false)
    expect(breakpoints.value.md).toEqual(true)
  })

  it('should update breakpoints when the media query changes', () => {
    const mdQuery = ref(false)
    vi.mocked(useMediaQuery).mockImplementation((query) =>
      query === `(min-width: ${screens.md})` ? mdQuery : ref(false),
    )

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

    // Mock useMediaQuery to return false since there’s no window
    vi.mocked(useMediaQuery).mockImplementation(() => ref(false))

    const {
      screens: exposedScreens,
      mediaQueries,
      breakpoints,
    } = useBreakpoints()

    // Screens should still be exposed since they’re static
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
