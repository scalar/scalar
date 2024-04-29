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

/** A component to insert the theme styles */
export { default as ThemeStyles } from './components/ThemeStyles.vue'

/** A scoped style reset component. */
export { default as ResetStyles } from './components/ResetStyles.vue'

/** A scoped scrollbar style component. */
export { default as ScrollbarStyles } from './components/ScrollbarStyles.vue'

/**  */
export { migrateThemeVariables } from './utilities/legacy'

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
 * User readable theme names / labels
 */
export const themeLabels: Record<ThemeId, string> = {
  default: 'Default',
  alternate: 'Alternate',
  moon: 'Moon',
  purple: 'Purple',
  solarized: 'Solarized',
  bluePlanet: 'Blue Planet',
  saturn: 'Saturn',
  kepler: 'Kepler-11e',
  mars: 'Mars',
  deepSpace: 'Deep Space',
  none: '',
}

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

type GetThemeOpts = {
  /**
   * Optional cascade layer to assign the theme styles to
   */
  layer?: string
}

/**
 * Get the theme CSS for a given theme ID.
 */
export const getThemeById = (themeId?: ThemeId, opts?: GetThemeOpts) => {
  if (themeId === 'none') return ''

  const styles = presets[themeId || 'default'] ?? defaultTheme

  // Wrap the styles in a layer if requested
  if (opts?.layer) return `@layer ${opts.layer} {\n${styles}}`
  return styles
}
