import type { ThemeId } from '@scalar/types/legacy'

import defaultFonts from './fonts.css?inline'
import alternateTheme from './presets/alternate.css?inline'
import bluePlanetTheme from './presets/bluePlanet.css?inline'
import deepSpaceTheme from './presets/deepSpace.css?inline'
import defaultTheme from './presets/default.css?inline'
import elysiajsTheme from './presets/elysiajs.css?inline'
import fastifyTheme from './presets/fastify.css?inline'
import keplerTheme from './presets/kepler.css?inline'
import marsTheme from './presets/mars.css?inline'
import moonTheme from './presets/moon.css?inline'
import purpleTheme from './presets/purple.css?inline'
import saturnTheme from './presets/saturn.css?inline'
import solarizedTheme from './presets/solarized.css?inline'

export { migrateThemeVariables } from '@scalar/types/api-reference'
export { hasObtrusiveScrollbars } from './utilities/hasObtrusiveScrollbars'

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
  'elysiajs',
  'fastify',
  'mars',
  'none',
] as const

export type IntegrationThemeId = 'elysiajs' | 'fastify'

/**
 * Available theme IDs as a type.
 */
export type { ThemeId }

/**
 * User readable theme names / labels
 */
export const themeLabels: Record<ThemeId, string> = {
  default: 'Default',
  alternate: 'Alternate',
  moon: 'Moon',
  purple: 'Purple',
  solarized: 'Solarized',
  elysiajs: 'Elysia.js',
  fastify: 'Fastify',
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
  elysiajs: elysiajsTheme,
  fastify: fastifyTheme,
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
  if (themeId === 'none') {
    return ''
  }

  return presets[themeId || 'default'] ?? defaultTheme
}

/**
 * Get the theme and base variables for a given theme
 */
export const getThemeStyles = (themeId?: ThemeId, opts?: GetThemeOpts) => {
  const { fonts = true, layer = 'scalar-theme' } = opts ?? {}

  // Combined theme, base variables and default fonts if configured
  const styles = [getThemeById(themeId), fonts ? defaultFonts : ''].join('')

  // Wrap the styles in a layer if configured
  if (layer) {
    return `@layer ${layer} {\n${styles}}`
  }
  return styles
}

// Export all presets for easier access
export { alternateTheme }
export { bluePlanetTheme }
export { deepSpaceTheme }
export { defaultTheme }
export { elysiajsTheme }
export { fastifyTheme }
export { keplerTheme }
export { marsTheme }
export { moonTheme }
export { purpleTheme }
export { saturnTheme }
export { solarizedTheme }
