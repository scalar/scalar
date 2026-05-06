import { type Theme, defaultFonts, themePresets } from '@scalar/themes'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'

const themePresentsMap = new Map<string, Theme>(themePresets.map((theme) => [theme.slug, theme]))

/**
 * Wraps theme CSS styles in a style tag for injection into the DOM.
 */
const wrapThemeInStyleTag = (themeStyles: string, dataTestId: string = 'scalar-theme') => {
  return `<style id="scalar-theme" data-testid="${dataTestId}">${themeStyles}</style>`
}

/**
 * Resolves theme styles by slug from built-in presets or custom themes.
 * Returns undefined if the theme is not found.
 */
const resolveThemeStyles = (themeSlug: string, customThemes: Theme[]): string | undefined => {
  const addFonts = (themeStyles?: string) => {
    return `${themeStyles}\n${defaultFonts}`
  }

  // Check built-in theme presets first
  if (themePresentsMap.has(themeSlug)) {
    return addFonts(themePresentsMap.get(themeSlug)?.theme ?? '')
  }

  // Check custom themes provided via props
  const customTheme = customThemes.find((theme) => theme.slug === themeSlug)
  if (customTheme) {
    return addFonts(customTheme.theme)
  }

  return undefined
}

/**
 * useTheme
 *
 * Reactive Vue.js hook to resolve and generate a <style> tag string based on the current theme.
 * Automatically selects the appropriate theme styles in the following priority order:
 *    1. Workspace theme (from the provided store, e.g. store.workspace['x-scalar-theme'])
 *    2. Fallback theme (from the fallbackThemeSlug prop)
 *    3. Default built-in theme (with slug "default")
 *
 * The returned `themeStyleTag` can be injected into your page to dynamically apply theming.
 *
 * @example
 * ```ts
 * // In a Vue component setup() function
 * import { ref } from 'vue'
 * import { useTheme } from './use-theme'
 *
 * const myThemes = ref([...])
 * const workspaceStore = ref(...)
 * const fallbackThemeSlug = ref('dark')
 *
 * const { themeStyleTag } = useTheme({
 *   customThemes: myThemes,
 *   fallbackThemeSlug,
 *   store: workspaceStore
 * })
 *
 * // To inject in template:
 * // <div v-html="themeStyleTag"></div>
 * ```
 */
export const useTheme = ({
  fallbackThemeSlug,
  store,
  customThemes,
}: {
  customThemes: MaybeRefOrGetter<Theme[]>
  fallbackThemeSlug: MaybeRefOrGetter<string>
  store: MaybeRefOrGetter<WorkspaceStore | null>
}) => {
  const themeStyles = computed<{ themeStyles: string; themeSlug: string }>(() => {
    // Always-defined fallback: built-in "default" theme
    const defaultThemeStyles = { themeStyles: resolveThemeStyles('default', [])!, themeSlug: 'default' }

    // Evaluate values
    const storeValue = toValue(store)
    const fallbackThemeSlugValue = toValue(fallbackThemeSlug)

    // If the store is not loaded, fall back immediately to default styling
    if (storeValue === null) {
      return defaultThemeStyles
    }

    // Determine which theme to use: prefer workspace theme, unless it's 'none'
    const workspaceTheme = storeValue.workspace['x-scalar-theme']
    const themeSlug = workspaceTheme === 'none' ? fallbackThemeSlugValue : workspaceTheme

    // First: If no theme slug is set, try fallback theme, else default
    if (!themeSlug) {
      const fallbackStyles = resolveThemeStyles(fallbackThemeSlugValue, toValue(customThemes))
      return fallbackStyles ? { themeStyles: fallbackStyles, themeSlug: fallbackThemeSlugValue } : defaultThemeStyles
    }

    // Second: Try resolving styles for the workspace or specified theme
    const themeStyles = resolveThemeStyles(themeSlug, toValue(customThemes))
    if (themeStyles) {
      return { themeStyles: themeStyles, themeSlug }
    }

    // Third: If theme not found, try resolving fallback theme
    const fallbackStyles = resolveThemeStyles(fallbackThemeSlugValue, toValue(customThemes))
    if (fallbackStyles) {
      return { themeStyles: fallbackStyles, themeSlug: fallbackThemeSlugValue }
    }

    // Last resort: use the built-in default theme
    return defaultThemeStyles
  })

  const themeStyleTag = computed(() => {
    return wrapThemeInStyleTag(themeStyles.value.themeStyles, themeStyles.value.themeSlug)
  })

  return {
    /**
     * Computed ref containing the resolved theme styles object
     * for the currently active theme. Always returns a style object,
     * never null, with proper fallback logic if custom or workspace themes are missing.
     */
    themeStyles,

    /**
     * Computed ref containing a <style> tag as a string,
     * ready to be injected into the DOM.
     * This wraps the currently active theme CSS variables/styles.
     */
    themeStyleTag,
  }
}
