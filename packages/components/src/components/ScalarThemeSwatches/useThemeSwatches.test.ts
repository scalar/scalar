import { presets } from '@scalar/themes'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useThemeSwatches } from './useThemeSwatches'

/**
 * Validates that a CSS color value is in a valid format.
 * Supports hex, rgba, rgb, hsl, hsla, color-mix, color(display-p3), named colors, and CSS variables.
 */
function isValidCssColor(value: string): boolean {
  const trimmed = value.trim()

  // Empty values are not valid colors
  if (!trimmed) {
    return false
  }

  // CSS variables (var(--variable-name))
  if (trimmed.startsWith('var(')) {
    return true
  }

  // Named colors (transparent, currentColor, etc.)
  // Using a Set for O(1) lookup
  const namedColors = new Set([
    'transparent',
    'currentcolor',
    'black',
    'white',
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
  ])
  if (namedColors.has(trimmed.toLowerCase())) {
    return true
  }

  // Hex colors (#fff, #ffffff, #fff0, #ffffff00)
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed)) {
    return true
  }

  // rgb/rgba colors (rgb(255, 255, 255), rgba(0, 0, 0, 0.5))
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(trimmed)) {
    return true
  }

  // hsl/hsla colors (hsl(0, 0%, 100%), hsla(0, 0%, 0%, 0.5))
  if (/^hsla?\(\s*\d+\s*,\s*[\d.%]+\s*,\s*[\d.%]+\s*(,\s*[\d.]+\s*)?\)$/.test(trimmed)) {
    return true
  }

  // color-mix() function (color-mix(in srgb, #fff, transparent 10%))
  // Check if it starts with color-mix( and ends with )
  if (trimmed.startsWith('color-mix(') && trimmed.endsWith(')')) {
    // Count parentheses to ensure they're balanced (basic check)
    const openParens = (trimmed.match(/\(/g) || []).length
    const closeParens = (trimmed.match(/\)/g) || []).length
    if (openParens === closeParens) {
      return true
    }
  }

  // color(display-p3 ...) function (color(display-p3 0 0.6 1 / 1))
  if (/^color\(display-p3\s+[\d.\s/]+\)$/.test(trimmed)) {
    return true
  }

  return false
}

describe('useThemeSwatches', () => {
  // Get all theme IDs from presets (excluding 'none' if it exists)
  const themeIds = Object.keys(presets).filter((id) => id !== 'none') as Array<keyof typeof presets>

  it.each(themeIds)('extracts colors for %s theme preset', (themeId) => {
    const themeCss = presets[themeId].theme

    const { colors } = useThemeSwatches(themeCss)
    const allColors = {
      ...colors.value.light,
      ...colors.value.dark,
    }

    // Should have at least some color variables extracted
    expect(Object.keys(allColors).length).toBeGreaterThan(0)

    // Verify each extracted color value is a valid CSS color
    for (const [key, value] of Object.entries(allColors)) {
      expect(isValidCssColor(value), `Color value "${value}" for variable "${key}" is not a valid CSS color`).toBe(true)
    }
  })

  it('returns reactive computed values', () => {
    const cssRef = ref('.light-mode { --scalar-color-1: #000000; }')
    const { colors } = useThemeSwatches(cssRef)

    // Initial values
    expect(colors.value.light).toBeDefined()
    expect(colors.value.dark).toBeDefined()
    expect(typeof colors.value.light).toBe('object')
    expect(typeof colors.value.dark).toBe('object')
    expect(colors.value.light['--scalar-color-1']).toBe('#000000')
    expect(colors.value.light['--scalar-color-2']).toBeUndefined()

    // Update the ref
    cssRef.value = '.light-mode { --scalar-color-1: #ffffff; --scalar-color-2: #111111; }'

    // Values should update reactively
    expect(colors.value.light['--scalar-color-1']).toBe('#ffffff')
    expect(colors.value.light['--scalar-color-2']).toBe('#111111')
  })

  describe('color validation', () => {
    it('validates hex color formats', () => {
      expect(isValidCssColor('#fff')).toBe(true)
      expect(isValidCssColor('#ffffff')).toBe(true)
      expect(isValidCssColor('#000000')).toBe(true)
      expect(isValidCssColor('#fff0')).toBe(true)
      expect(isValidCssColor('#ffffff00')).toBe(true)
      expect(isValidCssColor('invalid')).toBe(false)
    })

    it('validates rgba color formats', () => {
      expect(isValidCssColor('rgba(255, 255, 255, 1)')).toBe(true)
      expect(isValidCssColor('rgba(0, 0, 0, 0.5)')).toBe(true)
      expect(isValidCssColor('rgb(255, 255, 255)')).toBe(true)
      expect(isValidCssColor('rgba(255,255,255,0.8)')).toBe(true)
    })

    it('validates color-mix formats', () => {
      expect(isValidCssColor('color-mix(in srgb, #1a1a1a, transparent 10%)')).toBe(true)
      expect(isValidCssColor('color-mix(in srgb, var(--scalar-color-1), var(--scalar-background-1) 20%)')).toBe(true)
    })

    it('validates CSS variable formats', () => {
      expect(isValidCssColor('var(--scalar-color-1)')).toBe(true)
      expect(isValidCssColor('var(--scalar-background-1, #fff)')).toBe(true)
    })

    it('validates named colors', () => {
      expect(isValidCssColor('transparent')).toBe(true)
      expect(isValidCssColor('currentColor')).toBe(true)
      expect(isValidCssColor('black')).toBe(true)
      expect(isValidCssColor('white')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles empty CSS string', () => {
      const { colors } = useThemeSwatches('')
      expect(colors.value.light).toEqual({})
      expect(colors.value.dark).toEqual({})
    })

    it('handles CSS without light or dark mode sections', () => {
      const cssWithoutModes = `
        :root {
          --scalar-color-1: #000000;
          --scalar-background-1: #ffffff;
        }
      `
      const { colors } = useThemeSwatches(cssWithoutModes)
      expect(colors.value.light).toEqual({})
      expect(colors.value.dark).toEqual({})
    })

    it('handles CSS with only light mode', () => {
      const cssLightOnly = `
        .light-mode {
          --scalar-color-1: #000000;
          --scalar-background-1: #ffffff;
        }
      `
      const { colors } = useThemeSwatches(cssLightOnly)
      expect(Object.keys(colors.value.light).length).toBeGreaterThan(0)
      expect(colors.value.dark).toEqual({})
    })

    it('handles CSS with only dark mode', () => {
      const cssDarkOnly = `
        .dark-mode {
          --scalar-color-1: #ffffff;
          --scalar-background-1: #000000;
        }
      `
      const { colors } = useThemeSwatches(cssDarkOnly)
      expect(colors.value.light).toEqual({})
      expect(Object.keys(colors.value.dark).length).toBeGreaterThan(0)
    })

    it('handles reactive CSS updates', () => {
      const initialCss = '.light-mode { --scalar-color-1: #000000; }'
      const { colors } = useThemeSwatches(initialCss)

      const initialLightKeys = Object.keys(colors.value.light).length

      // Update CSS
      const updatedCss = '.light-mode { --scalar-color-1: #000000; --scalar-color-2: #111111; }'
      const { colors: updatedColors } = useThemeSwatches(updatedCss)

      // Should extract more variables from updated CSS
      expect(Object.keys(updatedColors.value.light).length).toBeGreaterThanOrEqual(initialLightKeys)
    })
  })
})
