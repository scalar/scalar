export const theme = {
  boxShadow: {
    DEFAULT: 'var(--theme-shadow-1, var(--default-theme-shadow-1))',
    md: 'var(--theme-shadow-2, var(--default-theme-shadow-2))',
    sm: 'rgba(0, 0, 0, 0.09) 0px 1px 4px',
    none: '0 0 #0000',
  },
  colors: {
    'fore-1': 'var(--theme-color-1, var(--default-theme-color-1))',
    'fore-2': 'var(--theme-color-2, var(--default-theme-color-2))',
    'fore-3': 'var(--theme-color-3, var(--default-theme-color-3))',
    'accent': 'var(--theme-color-accent, var(--default-theme-color-accent))',
    'back-1': 'var(--theme-background-1, var(--default-theme-background-1))',
    'back-2': 'var(--theme-background-2, var(--default-theme-background-2))',
    'back-3': 'var(--theme-background-3, var(--default-theme-background-3))',
    'back-accent':
      'var(--theme-background-accent, var(--default-theme-background-accent))',

    'backdrop': 'rgba(0, 0, 0, 0.44)',
    'border': 'var(--theme-border-color, var(--default-theme-border-color))',

    'back-btn-1': 'var(--theme-button-1, var(--default-theme-button-1))',
    'fore-btn-1':
      'var(--theme-button-1-color, var(--default-theme-button-1-color))',
    'hover-btn-1':
      'var(--theme-button-1-hover, var(--default-theme-button-1-hover))',

    'white': '#FFF',
    'green': 'var(--theme-color-green, var(--default-theme-color-green))',
    'red': 'var(--theme-color-red, var(--default-theme-color-red))',
    'yellow': 'var(--theme-color-yellow, var(--default-theme-color-yellow))',
    'blue': 'var(--theme-color-blue, var(--default-theme-color-blue))',
    'orange': 'var(--theme-color-orange, var(--default-theme-color-orange))',
    'purple': 'var(--theme-color-purple, var(--default-theme-color-purple))',
    'error': 'var(--theme-error-color, var(--default-theme-color-red))',
    'ghost': 'var(--theme-color-ghost, var(--default-theme-color-ghost))',
    'transparent': 'transparent',
  },
  fontSize: {
    xxs: 'var(--theme-micro, var(--default-theme-micro, var(--theme-font-size-5, var(--default-theme-font-size-5))))',
    xs: 'var(--theme-mini, var(--default-theme-mini, var(--theme-font-size-4, var(--default-theme-font-size-4))))',
    sm: 'var(--theme-small, var(--default-theme-small, var(--theme-font-size-3, var(--default-theme-font-size-3))))',
    base: 'var(--theme-paragraph, var(--default-theme-paragraph, var(--theme-font-size-2, var(--default-theme-font-size-2))))',
    lg: 'var(--theme-font-size-1, var(--default-theme-font-size-1))',
  },
} as const

export const extend = {
  borderRadius: {
    DEFAULT: 'var(--theme-radius, var(--default-theme-radius))',
    md: 'var(--theme-radius, var(--default-theme-radius))',
    lg: 'var(--theme-radius-lg, var(--default-theme-radius-lg))',
    xl: 'var(--theme-radius-xl, var(--default-theme-radius-xl))',
  },
  fontWeight: {
    medium: 'var(--theme-font-medium, var(--default-theme-font-medium))',
    bold: 'var(-theme-font-bold, var(--default-theme-font-bold))',
  },
  maxWidth: {
    'screen-xs': '480px',
    'screen-sm': '540px',
    'screen-md': '640px',
    'screen-lg': '800px',
  },
} as const
