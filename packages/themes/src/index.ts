import alternateTheme from './presets/alternate.css'
import defaultTheme from './presets/default.css'
import moonTheme from './presets/moon.css'
import purpleTheme from './presets/purple.css'
import solarizedTheme from './presets/solarized.css'

/**
 * A component to insert the theme styles.
 */
export { default as ThemeStyles } from './components/ThemeStyles.vue'

/**
 * Available theme IDs as a type.
 */
export type ThemeId = 'alternate' | 'default' | 'moon' | 'purple' | 'solarized'

/**
 * List of available theme presets.
 */
export const presets: Record<ThemeId, string> = {
  alternate: alternateTheme,
  default: defaultTheme,
  moon: moonTheme,
  purple: purpleTheme,
  solarized: solarizedTheme,
}

/**
 * List of available theme IDs.
 */
export const availableThemes = Object.keys(presets) as ThemeId[]

/**
 * Get the theme CSS for a given theme ID.
 */
export const getThemeById = (themeId: ThemeId = 'default') => {
  return presets[themeId] ?? defaultTheme
}
