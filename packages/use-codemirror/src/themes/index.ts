import {
  duotoneDarkInit,
  duotoneLightInit,
} from '@uiw/codemirror-theme-duotone'

export const lightTheme = duotoneLightInit({
  settings: {
    background: 'var(--theme-background-2)',
    gutterBackground: 'var(--theme-background-2)',
    gutterForeground: 'var(--theme-color-2)',
    foreground: 'var(--theme-color-1)',
    fontFamily: 'var(--theme-font-code)',
  },
})

export const darkTheme = duotoneDarkInit({
  settings: {
    background: 'var(--theme-background-2)',
    gutterBackground: 'var(--theme-background-2)',
    gutterForeground: 'var(--theme-color-2)',
    foreground: 'var(--theme-color-1)',
    fontFamily: 'var(--theme-font-code)',
  },
})
