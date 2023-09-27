import alternateTheme from './presets/alternate.css'
import defaultTheme from './presets/default.css'
import moonTheme from './presets/moon.css'
import purpleTheme from './presets/purple.css'
import solarizedTheme from './presets/solarized.css'

export type ThemeId = 'alternate' | 'default' | 'moon' | 'purple' | 'solarized'

export const presets: Record<ThemeId, string> = {
  alternate: alternateTheme,
  moon: moonTheme,
  purple: purpleTheme,
  solarized: solarizedTheme,
}

export const availableThemes = Object.keys(presets) as ThemeId[]

export const getThemeById = (themeId: ThemeId) => {
  return presets[themeId] ?? defaultTheme
}

export { default as ThemeCss } from './components/ThemeCss.vue'
