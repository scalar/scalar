import alternateTheme from './presets/alternate.css?inline'
import bluePlanetTheme from './presets/bluePlanet.css?inline'
import deepSpaceTheme from './presets/deepSpace.css?inline'
import defaultTheme from './presets/default.css?inline'
import keplerTheme from './presets/kepler.css?inline'
import marsTheme from './presets/mars.css?inline'
import moonTheme from './presets/moon.css?inline'
import purpleTheme from './presets/purple.css?inline'
import saturnTheme from './presets/saturn.css?inline'
import solarizedTheme from './presets/solarized.css?inline'

/**
 * A component to insert the theme styles.
 */
export { default as ThemeStyles } from './components/ThemeStyles.vue'

/**
 * Available theme IDs as a type.
 */
export type ThemeId =
  | 'alternate'
  | 'default'
  | 'moon'
  | 'purple'
  | 'solarized'
  | 'bluePlanet'
  | 'deepSpace'
  | 'saturn'
  | 'kepler'
  | 'mars'
  | 'none'

/**
 * List of available theme presets.
 */
export const presets: Record<Exclude<ThemeId, 'none'>, string> = {
  alternate: alternateTheme,
  default: defaultTheme,
  moon: moonTheme,
  purple: purpleTheme,
  solarized: solarizedTheme,
  bluePlanet: bluePlanetTheme,
  deepSpace: deepSpaceTheme,
  saturn: saturnTheme,
  kepler: keplerTheme,
  mars: marsTheme,
}

/**
 * List of available theme IDs.
 */
export const availableThemes = Object.keys(presets) as ThemeId[]

/**
 * Get the theme CSS for a given theme ID.
 */
export const getThemeById = (themeId: ThemeId = 'default') => {
  if (themeId === 'none') {
    return ''
  }

  return presets[themeId] ?? defaultTheme
}
