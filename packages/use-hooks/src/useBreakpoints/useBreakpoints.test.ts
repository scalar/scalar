import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { effectScope } from 'vue'

import { screens } from './constants'
import { useBreakpoints } from './useBreakpoints'

describe('useBreakpoints', () => {
  it('exposes the screen sizes', ({ onTestFinished }) => {
    const scope = effectScope()
    onTestFinished(() => scope.stop())
    const result = scope.run(() => useBreakpoints())!

    expect(result.screens).toStrictEqual(screens)
  })

  it('updates media queries when the viewport crosses a breakpoint', async ({ onTestFinished }) => {
    await page.viewport(799, 600)
    const scope = effectScope()
    onTestFinished(() => scope.stop())
    const { mediaQueries, breakpoints } = scope.run(() => useBreakpoints())!

    await expect
      .poll(() => breakpoints.value)
      .toStrictEqual({
        xs: true,
        sm: true,
        md: false,
        lg: false,
        xl: false,
        zoomed: false,
      })

    await page.viewport(800, 600)
    await expect.poll(() => mediaQueries.md.value).toBe(true)
    expect(breakpoints.value.md).toBe(true)

    await page.viewport(799, 600)
    await expect.poll(() => breakpoints.value.md).toBe(false)
  })

  it('matches the zoomed breakpoint only when both dimensions fit', async ({ onTestFinished }) => {
    const scope = effectScope()
    onTestFinished(() => scope.stop())
    const { breakpoints } = scope.run(() => useBreakpoints())!

    await page.viewport(720, 480)
    await expect.poll(() => breakpoints.value.zoomed).toBe(true)

    await page.viewport(721, 480)
    await expect.poll(() => breakpoints.value.zoomed).toBe(false)

    await page.viewport(720, 481)
    await expect.poll(() => breakpoints.value.zoomed).toBe(false)
  })
})
