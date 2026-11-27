import type { IntegrationThemeId, themePresets } from '@scalar/themes'

type ThemePresets = typeof themePresets

type Themes = Exclude<ThemePresets[number]['slug'], IntegrationThemeId>

export const getThemeColors = (themeId: Themes | 'none'): { light: string; dark: string; accent: string } => {
  const colors: Record<Themes, { light: string; dark: string; accent: string }> = {
    default: { light: '#fff', dark: '#0f0f0f', accent: '#0099ff' },
    alternate: { light: '#fafafa', dark: '#282c34', accent: '#465fee' },
    moon: { light: '#fdf6e3', dark: '#2d353b', accent: '#5b7719' },
    purple: { light: '#eff1f5', dark: '#1e1e2e', accent: '#8839ef' },
    solarized: { light: '#fdf6e3', dark: '#002b36', accent: '#8b6905' },
    'blue-planet': { light: '#ffffff', dark: '#0d1117', accent: '#0969da' },
    saturn: { light: '#fbf1c7', dark: '#282828', accent: '#327376' },
    'kepler-11e': { light: '#fcfcfd', dark: '#0f0f11', accent: '#5a65cd' },
    mars: { light: '#f9f9f7', dark: '#2d2d2b', accent: '#a4593b' },
    'deep-space': { light: '#ffffff', dark: '#000000', accent: '#0868f6' },
    laserwave: { light: '#f4f2f7', dark: '#27212e', accent: '#ed78c2' },
    halloween: { light: '#f7efe3', dark: '#1f1829', accent: '#ff8a3d' },
    'programmers-day': { light: '#eef3e0', dark: '#111a13', accent: '#39ff6a' },
  }
  return colors[themeId as Themes] || { light: '#ffffff', dark: '#000000', accent: '#3b82f6' }
}
