import type { IntegrationThemeId, themePresets } from '@scalar/themes'

type ThemePresets = typeof themePresets

type Themes = Exclude<ThemePresets[number]['slug'], IntegrationThemeId>

/** A single color swatch previewed next to a theme name */
export type ThemeSwatch = {
  /** Human readable name of the color, used as a stable key */
  label: string
  /** The CSS color value to paint the swatch with */
  color: string
}

/**
 * Preview colors for the built in themes.
 *
 * These are hardcoded rather than parsed from the theme CSS so that the settings
 * page does not have to load every theme just to render a few swatches.
 */
const THEME_COLORS: Record<Themes, { light: string; dark: string; accent: string }> = {
  default: { light: '#fff', dark: '#0f0f0f', accent: '#0099ff' },
  alternate: { light: '#f9f9f9', dark: '#131313', accent: '#e7e7e7' },
  moon: { light: '#ccc9b3', dark: '#313332', accent: '#645b0f' },
  purple: { light: '#f5f6f8', dark: '#22252b', accent: '#5469d4' },
  solarized: { light: '#fdf6e3', dark: '#00212b', accent: '#007acc' },
  'blue-planet': { light: '#f0f2f5', dark: '#000e23', accent: '#e0e2e6' },
  saturn: { light: '#e4e4df', dark: '#2c2c30', accent: '#1763a6' },
  'kepler-11e': { light: '#f6f6f6', dark: '#0d0f1e', accent: '#7070ff' },
  mars: { light: '#f2efe8', dark: '#321116', accent: '#c75549' },
  'deep-space': { light: '#f4f4f5', dark: '#09090b', accent: '#8ab4f8' },
  laserwave: { light: '#f4f2f7', dark: '#27212e', accent: '#ed78c2' },
}

/** Colors shown for themes we do not have a preview for, including "None" */
const FALLBACK_COLORS = { light: '#ffffff', dark: '#000000', accent: '#3b82f6' }

/** Returns the light, dark and accent swatches previewed for a theme */
export const getThemeSwatches = (themeId: Themes | 'none'): ThemeSwatch[] => {
  const { light, dark, accent } = THEME_COLORS[themeId as Themes] ?? FALLBACK_COLORS

  return [
    { label: 'Light', color: light },
    { label: 'Dark', color: dark },
    { label: 'Accent', color: accent },
  ]
}
