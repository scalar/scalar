import type { IntegrationThemeId, ThemeId } from '@scalar/themes'

type Themes = Exclude<ThemeId, IntegrationThemeId>

export const getThemeColors = (themeId: Themes): { light: string; dark: string; accent: string } => {
  const colors: Record<Themes, { light: string; dark: string; accent: string }> = {
    default: { light: '#fff', dark: '#0f0f0f', accent: '#0099ff' },
    alternate: { light: '#f9f9f9', dark: '#131313', accent: '#e7e7e7' },
    moon: { light: '#ccc9b3', dark: '#313332', accent: '#645b0f' },
    purple: { light: '#f5f6f8', dark: '#22252b', accent: '#5469d4' },
    solarized: { light: '#fdf6e3', dark: '#00212b', accent: '#007acc' },
    bluePlanet: { light: '#f0f2f5', dark: '#000e23', accent: '#e0e2e6' },
    saturn: { light: '#e4e4df', dark: '#2c2c30', accent: '#1763a6' },
    kepler: { light: '#f6f6f6', dark: '#0d0f1e', accent: '#7070ff' },
    mars: { light: '#f2efe8', dark: '#321116', accent: '#c75549' },
    deepSpace: { light: '#f4f4f5', dark: '#09090b', accent: '#8ab4f8' },
    laserwave: { light: '#f4f2f7', dark: '#27212e', accent: '#ed78c2' },
    none: { light: '#ffffff', dark: '#000000', accent: '#3b82f6' },
  }
  return colors[themeId] || { light: '#ffffff', dark: '#000000', accent: '#3b82f6' }
}
