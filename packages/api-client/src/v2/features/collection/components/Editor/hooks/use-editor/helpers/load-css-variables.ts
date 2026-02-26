import { z } from 'zod'

export const loadCssVariables = async (css: string) => {
  const sheet = new CSSStyleSheet()
  await sheet.replace(css)

  const parsed = Array.from(sheet.cssRules).reduce<{ light: any; dark: any }>(
    (acc, cur) => {
      if (!(cur instanceof CSSStyleRule)) {
        return acc
      }

      const styles = Object.values(cur.style).reduce<Record<string, string>>((style, name) => {
        if (!name.startsWith('--')) {
          return style
        }

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
