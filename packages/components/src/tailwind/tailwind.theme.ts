export const theme = {
  boxShadow: {
    DEFAULT: 'var(--scalar-shadow-1)',
    md: 'var(--scalar-shadow-2)',
    sm: 'rgba(0, 0, 0, 0.09) 0px 1px 4px',
    none: '0 0 #0000',
  },
  colors: {
    'fore-1': 'var(--scalar-color-1)',
    'fore-2': 'var(--scalar-color-2)',
    'fore-3': 'var(--scalar-color-3)',
    'accent': 'var(--scalar-color-accent)',
    'back-1': 'var(--scalar-background-1)',
    'back-2': 'var(--scalar-background-2)',
    'back-3': 'var(--scalar-background-3)',
    'back-accent': 'var(--scalar-background-accent)',

    'backdrop': 'rgba(0, 0, 0, 0.44)',
    'border': 'var(--scalar-border-color)',

    'back-btn-1': 'var(--scalar-button-1)',
    'fore-btn-1': 'var(--scalar-button-1-color)',
    'hover-btn-1': 'var(--scalar-button-1-hover)',

    'white': '#FFF',
    'green': 'var(--scalar-color-green)',
    'red': 'var(--scalar-color-red)',
    'yellow': 'var(--scalar-color-yellow)',
    'blue': 'var(--scalar-color-blue)',
    'orange': 'var(--scalar-color-orange)',
    'purple': 'var(--scalar-color-purple)',
    'error': 'var(--scalar-error-color)',
    'ghost': 'var(--scalar-color-ghost)',
    'transparent': 'transparent',
  },
  fontFamily: {
    sans: 'var(--scalar-font)',
    code: 'var(--scalar-font-code)',
  },
  zIndex: {
    '-1': '-1',
    '0': '0',
    '1': '1',
    // Contextual overlays like dropdowns, popovers, tooltips
    'context': '1000',
    // Full screen overlays / modals
    'overlay': '10000',
  },
} as const

export const extend = {
  borderRadius: {
    DEFAULT: 'var(--scalar-radius)',
    md: 'var(--scalar-radius)',
    lg: 'var(--scalar-radius-lg)',
    xl: 'var(--scalar-radius-xl)',
  },
  fontSize: {
    xxs: 'var(--scalar-micro, var(--scalar-font-size-5))',
    xs: 'var(--scalar-mini, var(--scalar-font-size-4))',
    sm: 'var(--scalar-small,var(--scalar-font-size-3))',
    base: 'var(--scalar-paragraph, var(--scalar-font-size-2))',
    lg: 'var(--scalar-font-size-1)',
  },
  fontWeight: {
    medium: 'var(--scalar-font-medium)',
    bold: 'var(--scalar-font-bold)',
  },
  maxWidth: {
    'screen-xs': '480px',
    'screen-sm': '540px',
    'screen-md': '640px',
    'screen-lg': '800px',
  },
  brightness: {
    lifted: 'var(--scalar-lifted-brightness)',
    backdrop: 'var(--scalar-backdrop-brightness)',
  },
  spacing: {
    px: '1px',
  },
} as const
