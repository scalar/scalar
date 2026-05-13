import type { Theme } from '@scalar/themes'

import { resolveThemeStyles } from './resolve-theme-styles'

/** The resolved theme styles with the slug that produced them */
type ResolvedThemeStyles = { themeStyles: string; themeSlug: string }

/**
 * Determines the active theme styles given a workspace theme slug, a fallback
 * slug, and an array of custom themes.
 *
 * Resolution priority:
 *   1. `workspaceThemeSlug` (unless it is `'none'`, which defers to fallback)
 *   2. `fallbackThemeSlug`
 *   3. Built-in `'default'` theme
 *
 * @param workspaceThemeSlug - The theme slug stored on the workspace (may be `undefined` or `'none'`)
 * @param fallbackThemeSlug  - The fallback derived from user/team preference
 * @param customThemes       - Custom themes fetched from the API
 */
export const getActiveThemeStyles = (
  workspaceThemeSlug: string | undefined,
  fallbackThemeSlug: string,
  customThemes: Theme[],
): ResolvedThemeStyles => {
  const defaultThemeStyles: ResolvedThemeStyles = {
    themeStyles: resolveThemeStyles('default', [])!,
    themeSlug: 'default',
  }

  // Prefer workspace theme, unless it is explicitly set to 'none'
  const themeSlug = workspaceThemeSlug === 'none' ? fallbackThemeSlug : workspaceThemeSlug

  // No theme slug set — try fallback, then default
  if (!themeSlug) {
    const fallbackStyles = resolveThemeStyles(fallbackThemeSlug, customThemes)
    return fallbackStyles ? { themeStyles: fallbackStyles, themeSlug: fallbackThemeSlug } : defaultThemeStyles
  }

  // Try resolving the active theme
  const resolved = resolveThemeStyles(themeSlug, customThemes)
  if (resolved) {
    return { themeStyles: resolved, themeSlug }
  }

  // Theme not found — try fallback
  const fallbackStyles = resolveThemeStyles(fallbackThemeSlug, customThemes)
  if (fallbackStyles) {
    return { themeStyles: fallbackStyles, themeSlug: fallbackThemeSlug }
  }

  return defaultThemeStyles
}
