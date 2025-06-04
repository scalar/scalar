import defaultFonts from './fonts/fonts.css?inline'
import alternateTheme from './presets/alternate.css?inline'
import bluePlanetTheme from './presets/bluePlanet.css?inline'
import deepSpaceTheme from './presets/deepSpace.css?inline'
import defaultTheme from './presets/default.css?inline'
import elysiajsTheme from './presets/elysiajs.css?inline'
import fastifyTheme from './presets/fastify.css?inline'
import keplerTheme from './presets/kepler.css?inline'
import marsTheme from './presets/mars.css?inline'
import moonTheme from './presets/moon.css?inline'
import laserwaveTheme from './presets/laserwave.css?inline'
import purpleTheme from './presets/purple.css?inline'
import saturnTheme from './presets/saturn.css?inline'
import solarizedTheme from './presets/solarized.css?inline'

import customThemeStarter from './presets/custom-theme-starter.css?inline'
export { hasObtrusiveScrollbars } from './utilities/has-obtrusive-scrollbars'
import { nanoid } from 'nanoid'

// Export all presets for easier access
export {
  alternateTheme,
  bluePlanetTheme,
  deepSpaceTheme,
  defaultTheme,
  elysiajsTheme,
  fastifyTheme,
  keplerTheme,
  marsTheme,
  moonTheme,
  purpleTheme,
  saturnTheme,
  solarizedTheme,
  laserwaveTheme,
  defaultFonts,
}

/** Theme definition for Scalar platform themes. Matches user provided theme definitions. */
export type Theme = {
  uid: string
  /** Display name of the theme */
  name: string
  /** Description of the theme */
  description: string
  /** CSS string for the theme */
  theme: string
  /** Text identifier for the theme. Used for specifying in scalar.config.ts */
  slug: string
  /** Deprecated themes will still be loadable but will be hidden from the UI for future selection */
  deprecated?: boolean
}

/** List of available theme IDs as a type. */
export type ThemeId = (typeof themeIds)[number]

export type IntegrationThemeId = 'elysiajs' | 'fastify'

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
  'laserwave',
  'none',
] as const

// ---------------------------------------------------------------------------

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
  laserwave: 'Laserwave',
  none: '',
}

/**
 * Formatted list of available theme presets.
 *
 * Used across the Scalar platform as base themes. Extendable by team defined themes
 *
 * Static UIDs must be assigned and never changed when a new theme is created.
 * Slugs should be formatted as kebab-case and cannot change after initial creation.
 */
export const presets: Record<Exclude<ThemeId, 'none'>, Theme> = {
  default: {
    uid: 'qTQR9jSM8E-LihpyZzPOi',
    name: 'Default',
    description: 'Default Scalar theme',
    theme: defaultTheme,
    slug: 'default',
  },
  alternate: {
    uid: '2skUDSH4S8HYFF9yXysr-',
    name: 'Alternate',
    description: 'Alternate Scalar theme',
    theme: alternateTheme,
    slug: 'alternate',
  },
  moon: {
    uid: 'DG9ZUNp5lJhDeX_kPX4Bl',
    name: 'Moon',
    description: 'Lunar styles',
    theme: moonTheme,
    slug: 'moon',
  },
  purple: {
    uid: 'pE_1ysxcZ-y2LM1GGNBUv',
    name: 'Purple',
    description: 'Purple Scalar theme',
    theme: purpleTheme,
    slug: 'purple',
  },
  solarized: {
    uid: 'BdGVG1vf-4nYl3wJKyj8l',
    name: 'Solarized',
    description: 'Solarized Scalar theme',
    theme: solarizedTheme,
    slug: 'solarized',
  },
  bluePlanet: {
    uid: 'X12IfAvl7ue-42V2lW40S',
    name: 'Blue Planet',
    description: 'Blue Planet Scalar theme',
    theme: bluePlanetTheme,
    slug: 'blue-planet',
  },
  deepSpace: {
    uid: 'K8b38NWQiicq4-zXGXKdI',
    name: 'Deep Space',
    description: 'Deep Space Scalar theme',
    theme: deepSpaceTheme,
    slug: 'deep-space',
  },
  saturn: {
    uid: '1jyAjmbIZQG-RUU4Ugk9o',
    name: 'Saturn',
    description: 'Saturn Scalar theme',
    theme: saturnTheme,
    slug: 'saturn',
  },
  kepler: {
    uid: 'jZ6dnWbtqQ0Hz3s9jLPH0',
    name: 'Kepler-11e',
    description: 'Kepler-11e Scalar theme',
    theme: keplerTheme,
    slug: 'kepler-11e',
  },
  mars: {
    uid: 'YY4LQgwiXix55-TmMz9qd',
    name: 'Mars',
    description: 'Mars Scalar theme',
    theme: marsTheme,
    slug: 'mars',
  },
  laserwave: {
    uid: 'c5fZEi-K-hP-xXf885dkf',
    name: 'Laserwave',
    description: 'Laserwave Scalar theme',
    theme: laserwaveTheme,
    slug: 'laserwave',
  },
  elysiajs: {
    uid: 'nEVZkRmCylPkT0o9YJa7y',
    name: 'Elysia.js',
    description: 'Elysia.js theme',
    theme: elysiajsTheme,
    slug: 'elysiajs',
  },
  fastify: {
    uid: 'nTZcdcM2_yHFZFxTQe9Kk',
    name: 'Fastify',
    description: 'Fastify theme',
    theme: fastifyTheme,
    slug: 'fastify',
  },
}

/** List of available theme presets */
export const themePresets = Object.values(presets)

/** Starter custom theme styles with all variables and options */
export const getStarterTheme = (name: string): Theme => ({
  name,
  slug: name
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255),
  description: '',
  uid: nanoid(),
  theme: customThemeStarter,
})

/** Get the theme and base variables for a given theme */
export const getThemeStyles = (
  themeId?: ThemeId,
  opts?: {
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
  },
) => {
  const { fonts = true, layer = 'scalar-theme' } = opts ?? {}

  // Combined theme, base variables and default fonts if configured
  const styles = [
    presets[(themeId as Exclude<ThemeId, 'none'>) || 'default']?.theme ?? defaultTheme,
    fonts ? defaultFonts : '',
  ].join('')

  // Wrap the styles in a layer if configured
  if (layer) {
    return `@layer ${layer} {\n${styles}}`
  }
  return styles
}
