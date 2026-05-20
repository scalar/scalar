import { type MaybeRefOrGetter, computed, toValue } from 'vue'

/** Numbers 1 to 3 */
type OneToThree = 1 | 2 | 3

/**
 * CSS variable names that can be extracted from theme CSS
 */
type ThemeCssVar = `--scalar-color-${OneToThree}` | `--scalar-background-${OneToThree}` | '--scalar-color-accent'

/**
 * Theme colors for light and dark modes
 */
type ThemeColors = {
  light: ThemeCssVars
  dark: ThemeCssVars
}

/**
 * Record of theme CSS variables to their values (partial)
 */
type ThemeCssVars = Partial<Record<ThemeCssVar, string>>

/** Theme CSS variables */
export const THEME_CSS_VARS = [
  '--scalar-color-1',
  '--scalar-color-2',
  '--scalar-color-3',
  '--scalar-background-1',
  '--scalar-background-2',
  '--scalar-background-3',
  '--scalar-color-accent',
] as const satisfies ThemeCssVar[]

/**
 * Parses a given css string for a css variable regexp
 */
function getVars(cssVarPattern: string, css: string): Partial<Record<ThemeCssVar, string>> {
  const matches = [...css.matchAll(new RegExp(`(${cssVarPattern}): ([^;]+);`, 'gm'))]
  if (matches.length === 0) {
    return {}
  }
  return Object.fromEntries(matches.map((match) => [match[1], match[2]]))
}

/**
 * Parses a given css string for the variables we want
 */
function parseRules(css?: string): ThemeCssVars {
  if (!css) {
    return {}
  }
  return {
    ...getVars('--scalar-color-[1-3]', css),
    ...getVars('--scalar-background-[1-3]', css),
    ...getVars('--scalar-color-accent', css),
  } as ThemeCssVars
}

/**
 * Returns the light and dark colors for a given css string
 */
export function useThemeSwatches(css: MaybeRefOrGetter<string>) {
  return {
    colors: computed<ThemeColors>(() => ({
      light: parseRules(toValue(css).match(/\.light-mode[^{]*{[^}]*}/m)?.[0]),
      dark: parseRules(toValue(css).match(/\.dark-mode[^{]*{[^}]*}/m)?.[0]),
    })),
  }
}
