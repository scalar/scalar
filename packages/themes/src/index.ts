import defaultFonts from './fonts.css?inline'

/**
 * Import the raw CSS (?raw, not ?inline) to avoid minification by Vite/Rollup
 *
 * @see https://github.com/scalar/scalar/pull/2462
 */
import alternateTheme from './presets/alternate.css?raw'
import bluePlanetTheme from './presets/bluePlanet.css?raw'
import deepSpaceTheme from './presets/deepSpace.css?raw'
import defaultTheme from './presets/default.css?raw'
import keplerTheme from './presets/kepler.css?raw'
import marsTheme from './presets/mars.css?raw'
import moonTheme from './presets/moon.css?raw'
import purpleTheme from './presets/purple.css?raw'
import saturnTheme from './presets/saturn.css?raw'
import solarizedTheme from './presets/solarized.css?raw'
import baseVariables from './variables.css?inline'

export { migrateThemeVariables } from './utilities/legacy'

export const themeIds = [
  'alternate',
  'default',
  'moon',
  'purple',
  'solarized',
  'bluePlanet',
  'deepSpace',
  'saturn',
  'kepler',
  'mars',
  'none',
] as const

/**
 * Available theme IDs as a type.
 */
export type ThemeId = (typeof themeIds)[number]

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
 * Get the CSS for the default Scalar fonts
 */
export const getDefaultFonts = () => defaultFonts

/**
 * List of available theme IDs.
 */
export const availableThemes = Object.keys(presets) as ThemeId[]

type GetThemeOpts = {
  /**
   * Whether or not to include the base variables (e.g. typography)
   *
   * @default true
   */
  variables?: boolean
  /**
   * Whether or not to include the definitions for the default scalar fonts (e.g. Inter)
   *
   * @default true
   */
  fonts?: boolean
  /**
   * Cascade layer to assign the theme styles to
   *
   * @default 'scalar-theme'
   */
  layer?: string | false
}

/**
 * Get the theme CSS for a given theme ID.
 */
export const getThemeById = (themeId?: ThemeId) => {
  if (themeId === 'none') return ''

  return presets[themeId || 'default'] ?? defaultTheme
}

/**
 * Get the theme and base variables for a given theme
 */
export const getThemeStyles = (themeId?: ThemeId, opts?: GetThemeOpts) => {
  const { variables = true, fonts = true, layer = 'scalar-theme' } = opts ?? {}

  // Combined theme, base variables and default fonts if configured
  const styles = [
    getThemeById(themeId),
    variables ? baseVariables : '',
    fonts ? defaultFonts : '',
  ].join('')

  // Wrap the styles in a layer if configured
  if (layer) return `@layer ${layer} {\n${styles}}`
  return styles
}
