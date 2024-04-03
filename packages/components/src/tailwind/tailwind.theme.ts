export const theme = {
  boxShadow: {
    DEFAULT: 'var(--scalar-shadow-1, var(--default-scalar-shadow-1))',
    md: 'var(--scalar-shadow-2, var(--default-scalar-shadow-2))',
    sm: 'rgba(0, 0, 0, 0.09) 0px 1px 4px',
    none: '0 0 #0000',
  },
  colors: {
    'fore-1': 'var(--scalar-color-1, var(--default-scalar-color-1))',
    'fore-2': 'var(--scalar-color-2, var(--default-scalar-color-2))',
    'fore-3': 'var(--scalar-color-3, var(--default-scalar-color-3))',
    'accent': 'var(--scalar-color-accent, var(--default-scalar-color-accent))',
    'back-1': 'var(--scalar-background-1, var(--default-scalar-background-1))',
    'back-2': 'var(--scalar-background-2, var(--default-scalar-background-2))',
    'back-3': 'var(--scalar-background-3, var(--default-scalar-background-3))',
    'back-accent':
      'var(--scalar-background-accent, var(--default-scalar-background-accent))',

    'backdrop': 'rgba(0, 0, 0, 0.44)',
    'border': 'var(--scalar-border-color, var(--default-scalar-border-color))',

    'back-btn-1': 'var(--scalar-button-1, var(--default-scalar-button-1))',
    'fore-btn-1':
      'var(--scalar-button-1-color, var(--default-scalar-button-1-color))',
    'hover-btn-1':
      'var(--scalar-button-1-hover, var(--default-scalar-button-1-hover))',

    'white': '#FFF',
    'green': 'var(--scalar-color-green, var(--default-scalar-color-green))',
    'red': 'var(--scalar-color-red, var(--default-scalar-color-red))',
    'yellow': 'var(--scalar-color-yellow, var(--default-scalar-color-yellow))',
    'blue': 'var(--scalar-color-blue, var(--default-scalar-color-blue))',
    'orange': 'var(--scalar-color-orange, var(--default-scalar-color-orange))',
    'purple': 'var(--scalar-color-purple, var(--default-scalar-color-purple))',
    'error': 'var(--scalar-error-color, var(--default-scalar-color-red))',
    'ghost': 'var(--scalar-color-ghost, var(--default-scalar-color-ghost))',
    'transparent': 'transparent',
  },
} as const

export const extend = {
  borderRadius: {
    DEFAULT: 'var(--scalar-radius, var(--default-scalar-radius))',
    md: 'var(--scalar-radius, var(--default-scalar-radius))',
    lg: 'var(--scalar-radius-lg, var(--default-scalar-radius-lg))',
    xl: 'var(--scalar-radius-xl, var(--default-scalar-radius-xl))',
  },
  fontSize: {
    xxs: 'var(--scalar-micro, var(--default-scalar-micro, var(--scalar-font-size-5, var(--default-scalar-font-size-5))))',
    xs: 'var(--scalar-mini, var(--default-scalar-mini, var(--scalar-font-size-4, var(--default-scalar-font-size-4))))',
    sm: 'var(--scalar-small, var(--default-scalar-small, var(--scalar-font-size-3, var(--default-scalar-font-size-3))))',
    base: 'var(--scalar-paragraph, var(--default-scalar-paragraph, var(--scalar-font-size-2, var(--default-scalar-font-size-2))))',
    lg: 'var(--scalar-font-size-1, var(--default-scalar-font-size-1))',
  },
  fontWeight: {
    medium: 'var(--scalar-font-medium, var(--default-scalar-font-medium))',
    bold: 'var(--scalar-font-bold, var(--default-scalar-font-bold))',
  },
  maxWidth: {
    'screen-xs': '480px',
    'screen-sm': '540px',
    'screen-md': '640px',
    'screen-lg': '800px',
  },
} as const
