import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'

import { screens } from './constants'
import { useBreakpoints } from './useBreakpoints'

describe('useBreakpoints', () => {
  it('exposes inactive media queries without window', ({ onTestFinished }) => {
    const scope = effectScope()
    onTestFinished(() => scope.stop())
    const result = scope.run(() => useBreakpoints())!

    expect(typeof window).toBe('undefined')
    expect(result.screens).toStrictEqual(screens)
    expect(result.breakpoints.value).toStrictEqual({
      xs: false,
      sm: false,
      md: false,
      lg: false,
      xl: false,
      zoomed: false,
    })
    for (const query of Object.values(result.mediaQueries)) {
      expect(query.value).toBe(false)
    }
  })
})
