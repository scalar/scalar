import { z } from 'zod'

/**
 * Extracts CSS custom properties (variables) from a given CSS string
 * for .light-mode and .dark-mode selectors and returns an object
 * with 'light' and 'dark' keys containing the filtered variables.
 * Only variables matching hex color values (#RRGGBB or #RRGGBBAA) are accepted.
 *
 * @param css - The CSS string to parse.
 * @returns An object with `light` and `dark` properties containing the extracted CSS variables.
 */
export const loadCssVariables = async (css: string) => {
  const sheet = new CSSStyleSheet()
  await sheet.replace(css)

  const parsed = Array.from(sheet.cssRules).reduce<{ light: any; dark: any }>(
    (acc, cur) => {
      // Process only style rules (skip e.g. media, font-face, etc.)
      if (!(cur instanceof CSSStyleRule)) {
        return acc
      }

      // Collect valid CSS variable declarations from the rule's style
      const styles = Object.values(cur.style).reduce<Record<string, string>>((style, name) => {
        if (!name.startsWith('--')) {
          return style
        }

        // Only accept variables that match hex color format
        const value = z
          .string()
          .regex(/^(?:#(?:[0-9A-F]{6}|[0-9A-F]{8}))$/i)
          .safeParse(cur.style.getPropertyValue(name).toUpperCase().trim())

        if (value.error) {
          return style
        }

        style[name] = value.data

        return style
      }, {})

      // Merge variables into the correct theme object based on selector
      if (cur.selectorText.includes('.light-mode')) {
        acc.light = { ...acc.light, ...styles }
      }

      if (cur.selectorText.includes('.dark-mode')) {
        acc.dark = { ...acc.dark, ...styles }
      }

      return acc
    },
    { light: {}, dark: {} },
  )

  return parsed
}
