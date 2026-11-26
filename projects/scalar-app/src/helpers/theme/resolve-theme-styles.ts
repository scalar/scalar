import { type Theme, themePresets } from '@scalar/themes'

const themePresetsMap = new Map<string, Theme>(themePresets.map((theme) => [theme.slug, theme]))

/**
 * Resolves theme styles by slug from built-in presets or custom themes.
 * Returns `undefined` if the theme is not found.
 */
export const resolveThemeStyles = (themeSlug: string, customThemes: Theme[]): string | undefined => {
  // Check built-in theme presets first
  if (themePresetsMap.has(themeSlug)) {
    return themePresetsMap.get(themeSlug)?.theme ?? ''
  }

  // Check custom themes provided via props
  const customTheme = customThemes.find((theme) => theme.slug === themeSlug)
  if (customTheme) {
    return customTheme.theme
  }

  return undefined
}
