import { type Theme, getThemeStyles, themePresets } from '@scalar/themes'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'

const themePresentsMap = new Map<string, Theme>(themePresets.map((theme) => [theme.slug, theme]))

/**
 * Wraps theme CSS styles in a style tag for injection into the DOM.
 */
const wrapThemeInStyleTag = (themeStyles: string) => {
  return `<style id="scalar-theme">${themeStyles}</style>`
}

/**
 * Resolves theme styles by slug from built-in presets or custom themes.
 * Returns undefined if the theme is not found.
 */
const resolveThemeStyles = (themeSlug: string, customThemes: Theme[]): string | undefined => {
  // Check built-in theme presets first
  if (themePresentsMap.has(themeSlug)) {
    return themePresentsMap.get(themeSlug)?.theme
  }

  // Check custom themes provided via props
  const customTheme = customThemes.find((theme) => theme.slug === themeSlug)
  if (customTheme) {
    return customTheme.theme
  }

  return undefined
}

export const useTheme = ({
  fallbackThemeSlug,
  store,
  customThemes,
}: {
  customThemes: MaybeRefOrGetter<Theme[]>
  fallbackThemeSlug: MaybeRefOrGetter<string>
  store: MaybeRefOrGetter<WorkspaceStore | null>
}) => {
  /**
   * Generates the theme style tag for dynamic theme application.
   * Resolution order:
   * 1. Workspace theme (from store)
   * 2. Fallback theme (from props)
   * 3. Default theme (built-in)
   */
  const themeStyleTag = computed(() => {
    const defaultThemeStyles = wrapThemeInStyleTag(getThemeStyles('default'))

    const storeValue = toValue(store)

    // No store loaded yet, use default theme
    if (storeValue === null) {
      return defaultThemeStyles
    }

    const fallbackThemeSlugValue = toValue(fallbackThemeSlug)

    // Determine which theme to use
    const workspaceTheme = storeValue.workspace['x-scalar-theme']
    const themeSlug = workspaceTheme === 'none' ? fallbackThemeSlugValue : workspaceTheme

    // If no theme is specified, try fallback then default
    if (!themeSlug) {
      const fallbackStyles = resolveThemeStyles(fallbackThemeSlugValue, toValue(customThemes))
      return fallbackStyles ? wrapThemeInStyleTag(fallbackStyles) : defaultThemeStyles
    }

    // Try to resolve the requested theme
    const themeStyles = resolveThemeStyles(themeSlug, toValue(customThemes))
    if (themeStyles) {
      return wrapThemeInStyleTag(themeStyles)
    }

    // Theme not found, try fallback
    const fallbackStyles = resolveThemeStyles(fallbackThemeSlugValue, toValue(customThemes))
    if (fallbackStyles) {
      return wrapThemeInStyleTag(fallbackStyles)
    }

    // Last resort: use default theme
    return defaultThemeStyles
  })

  return {
    themeStyleTag,
  }
}
