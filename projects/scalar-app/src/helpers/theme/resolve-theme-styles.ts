import { type Theme, defaultFonts, themePresets } from '@scalar/themes'

const themePresetsMap = new Map<string, Theme>(themePresets.map((theme) => [theme.slug, theme]))

/**
 * Resolves theme styles by slug from built-in presets or custom themes.
 * Returns `undefined` if the theme is not found.
 */
export const resolveThemeStyles = (themeSlug: string, customThemes: Theme[]): string | undefined => {
  const addFonts = (themeStyles?: string): string => {
    return `${themeStyles}\n${defaultFonts}`
  }

  // Check built-in theme presets first
  if (themePresetsMap.has(themeSlug)) {
    return addFonts(themePresetsMap.get(themeSlug)?.theme ?? '')
  }

  // Check custom themes provided via props
  const customTheme = customThemes.find((theme) => theme.slug === themeSlug)
  if (customTheme) {
    return addFonts(customTheme.theme)
  }

  return undefined
}
