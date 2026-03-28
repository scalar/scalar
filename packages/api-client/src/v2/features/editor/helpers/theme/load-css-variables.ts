import { z } from 'zod'

/** Which theme bucket a CSS rule applies to after parsing. */
type ColorMode = 'light' | 'dark'

/** Accumulated custom properties per mode while walking stylesheet rules. */
type Variables = Record<ColorMode, Record<string, string>>

/**
 * Patterns for CSS color values we can normalize to hex (or pass through as var()).
 * Space-separated rgb() and modern slash syntax are not supported here.
 */
const hexShortRegex = /^#([0-9a-fA-F]){3}$/
const hexRegex = /^#([0-9a-fA-F]{6})$/
const hexAlphaRegex = /^#([0-9a-fA-F]{8})$/
const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,?\s*(\d{1,3})\s*,?\s*(\d{1,3})\s*\)$/
const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,?\s*(\d{1,3})\s*,?\s*(\d{1,3})\s*,?\s*(\d*\.?\d+)\s*\)$/
/** Optional fallback: var(--name, fallback) */
const varRegex = /^var\(\s*(--[^)]+)\s*(?:,\s*([^)]*))?\s*\)$/i

/**
 * Maps a comma-separated selector list to the theme modes it applies to.
 * Only **exact** `.light-mode` or `.dark-mode` selectors match (no compound selectors like `.light-mode .foo`).
 */
export const getColorModesFromSelectors = (text: string) => {
  const selectors = text.split(',').map((selector) => selector.trim())

  return selectors
    .map((selector) => {
      if (selector === '.light-mode') {
        return 'light'
      }
      if (selector === '.dark-mode') {
        return 'dark'
      }
      return null
    })
    .filter((mode) => mode !== null)
}

/**
 * Parses a single custom property value from the stylesheet into a normalized form:
 * - `#RRGGBB` / `#RRGGBBAA` (uppercase)
 * - `#RGB` short hex expanded to six digits
 * - `rgb()` / `rgba()` with comma-separated channels (lower input only)
 * - `var(--x)` / `var(--x, fallback)` returned as-is for a later resolve pass
 */
export const parseVariableValue = (value: string) => {
  const normalized = value.trim().toLowerCase()

  const hexValue = z.union([z.string().regex(hexRegex), z.string().regex(hexAlphaRegex)]).safeParse(normalized)

  if (!hexValue.error) {
    return hexValue.data.toUpperCase()
  }

  const shortHexValue = z.string().regex(hexShortRegex).safeParse(normalized)

  if (!shortHexValue.error) {
    const [_, r, g, b] = shortHexValue.data.toUpperCase()
    return `#${r}${r}${g}${g}${b}${b}`
  }

  const rgbValue = z.union([z.string().regex(rgbRegex), z.string().regex(rgbaRegex)]).safeParse(normalized)

  if (!rgbValue.error) {
    const [_, r = '0', g = '0', b = '0', a = '1'] = rgbValue.data.startsWith('rgba')
      ? (rgbaRegex.exec(rgbValue.data) ?? [])
      : (rgbRegex.exec(rgbValue.data) ?? [])

    const toHex = (v: string) => Number.parseInt(v, 10).toString(16).padStart(2, '0').toUpperCase()
    const alpha = Math.round(Number.parseFloat(a) * 255)

    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha === 255 ? '' : toHex(String(alpha))}`
  }

  const varValue = z.string().regex(varRegex).safeParse(normalized)
  if (!varValue.error) {
    return varValue.data
  }

  return undefined
}

/**
 * Recursively resolves a value if it is (or becomes) `var(--name)` against `variables`.
 * Missing names or non-var values are returned unchanged.
 */
export const resolveVariableValue = (value: string, variables: Record<string, string>): string => {
  const varValue = z.string().regex(varRegex).safeParse(value)
  if (!varValue.error) {
    const [_, varName] = varRegex.exec(varValue.data) ?? []
    if (!varName) {
      return value
    }
    const resolved = variables[varName]
    if (!resolved) {
      return value
    }
    return resolveVariableValue(resolved, variables)
  }
  return value
}

/**
 * Resolves `var(--*)` values in a flat map of custom properties in one pass.
 * Values that are not var references are copied through.
 */
export const resolveVariables = (variables: Record<string, string>): Record<string, string> => {
  const entries = Object.entries(variables)

  const resolved = entries.map(([name, value]) => {
    const varValue = z.string().regex(varRegex).safeParse(value)
    if (!varValue.error) {
      return [name, resolveVariableValue(varValue.data, variables)]
    }
    return [name, value]
  })
  return Object.fromEntries(resolved)
}

/**
 * Extracts CSS custom properties (variables) from a given CSS string
 * for .light-mode and .dark-mode selectors and returns an object
 * with 'light' and 'dark' keys containing the filtered variables.
 *
 * @param css - The CSS string to parse.
 * @returns An object with `light` and `dark` properties containing the extracted CSS variables.
 */
export const loadCssVariables = async (css: string) => {
  const sheet = new CSSStyleSheet()
  await sheet.replace(css)

  const cssRules = Array.from(sheet.cssRules).filter((cssRule) => cssRule instanceof CSSStyleRule)
  const parsed = cssRules.reduce<Variables>(
    (variables, cssRule) => {
      const colorModes = getColorModesFromSelectors(cssRule.selectorText)
      if (!colorModes.length) {
        return variables
      }

      // Collect valid CSS variable declarations from the rule's style
      const styles = Array.from(cssRule.style).reduce<Record<string, string>>((style, name) => {
        if (!name.startsWith('--')) {
          return style
        }
        const value = cssRule.style.getPropertyValue(name)
        const parsedValue = parseVariableValue(value)
        if (parsedValue) {
          style[name] = parsedValue
        }
        return style
      }, {})

      colorModes.forEach((colorMode) => {
        variables[colorMode] = { ...variables[colorMode], ...styles }
      })

      return variables
    },
    { light: {}, dark: {} },
  )

  return {
    light: resolveVariables(parsed.light),
    dark: resolveVariables(parsed.dark),
  }
}
