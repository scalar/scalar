import type { Config } from 'tailwindcss'

import pixelPreset from './pixelPreset'

/** Scalar Tailwind Preset */
export default {
  darkMode: ['selector', '.dark-mode'],
  presets: [pixelPreset],
  theme: {
    borderRadius: {
      DEFAULT: 'var(--scalar-radius)',
      md: 'var(--scalar-radius)',
      lg: 'var(--scalar-radius-lg)',
      xl: 'var(--scalar-radius-xl)',
      px: '1px',
      full: '9999px',
      none: '0px',
    },
    borderWidth: {
      'DEFAULT': 'var(--scalar-border-width)',
      '0': '0',
      '1/2': 'calc(var(--scalar-border-width) / 2)',
      '1': 'var(--scalar-border-width)',
      '2': 'calc(var(--scalar-border-width) * 2)',
      '4': 'calc(var(--scalar-border-width) * 4)',
    },
    boxShadow: {
      'DEFAULT': 'var(--scalar-shadow-1)',
      'lg': 'var(--scalar-shadow-2)',
      'md': 'var(--scalar-shadow-1)',
      'sm': 'rgba(0, 0, 0, 0.09) 0px 1px 4px',
      'none': '0 0 #0000',
      'border': 'inset 0 0 0 1px var(--scalar-border-color)',
      'border-1/2': 'inset 0 0 0 .5px var(--scalar-border-color)',
    },
    fontFamily: {
      DEFAULT: 'var(--scalar-font)',
      sans: 'var(--scalar-font)',
      code: 'var(--scalar-font-code)',
    },
    fontSize: {
      '3xs': 'var(--scalar-font-size-7)',
      'xxs': 'var(--scalar-font-size-6)',
      'xs': 'var(--scalar-font-size-5)',
      'sm': 'var(--scalar-font-size-4)',
      'base': 'var(--scalar-font-size-3)',
      'lg': 'var(--scalar-font-size-2)',
      'xl': 'var(--scalar-font-size-1)',
    },
    fontWeight: {
      DEFAULT: 'var(--scalar-regular)',
      normal: 'var(--scalar-regular)',
      medium: 'var(--scalar-semibold)',
      bold: 'var(--scalar-bold)',
    },
    colors: {
      current: 'currentColor',
      inherit: 'inherit',
      // Backdrop Colors
      b: {
        1: 'var(--scalar-background-1)',
        1.5: 'color-mix(in srgb, var(--scalar-background-1), var(--scalar-background-2))',
        2: 'var(--scalar-background-2)',
        3: 'var(--scalar-background-3)',
        4: 'var(--scalar-background-3)',
        accent: 'var(--scalar-background-accent)',
        btn: 'var(--scalar-button-1)',
        danger: 'var(--scalar-background-danger)',
        alert: 'var(--scalar-background-alert)',
      },

      // Foreground / Text Colors
      c: {
        1: 'var(--scalar-color-1)',
        2: 'var(--scalar-color-2)',
        3: 'var(--scalar-color-3)',
        accent: 'var(--scalar-color-accent)',
        ghost: 'var(--scalar-color-ghost)',
        disabled: 'var(--scalar-color-disabled)',
        btn: 'var(--scalar-button-1-color)',
        danger: 'var(--scalar-color-danger)',
        alert: 'var(--scalar-color-alert)',
      },

      // Hover Colors
      h: {
        btn: 'var(--scalar-button-1-hover)',
      },

      // Sidebar Colors
      sidebar: {
        b: {
          1: 'var(--scalar-sidebar-background-1, var(--scalar-background-1))',
        },
        c: {
          1: 'var(--scalar-sidebar-color-1, var(--scalar-color-1))',
          2: 'var(--scalar-sidebar-color-2, var(--scalar-color-2))',
        },
        border: 'var(--scalar-sidebar-border-color, var(--scalar-border-color))',
      },

      // Utility Colors
      backdrop: 'rgba(0, 0, 0, 0.22)', // Overlay Backdrops
      backdropdark: 'rgba(0, 0, 0, 0.45)', // Overlay Backdrops
      border: 'var(--scalar-border-color)',
      brand: 'var(--scalar-brand)',

      // Themed Primary Colors
      green: 'var(--scalar-color-green)',
      red: 'var(--scalar-color-red)',
      yellow: 'var(--scalar-color-yellow)',
      blue: 'var(--scalar-color-blue)',
      orange: 'var(--scalar-color-orange)',
      purple: 'var(--scalar-color-purple)',
      grey: 'var(--scalar-color-3)',
      indigo: 'var(--scalar-color-blue)',
      pink: 'var(--scalar-color-pink)',

      // Hard-coded Colors
      white: '#FFF',
      transparent: 'transparent',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
      DEFAULT: '1.5',
      1: 'var(--scalar-line-height-1)',
      2: 'var(--scalar-line-height-2)',
      3: 'var(--scalar-line-height-3)',
      4: 'var(--scalar-line-height-4)',
      5: 'var(--scalar-line-height-5)',
    },
    screens: {
      /** Mobile */
      xs: '400px',
      /** Large Mobile */
      sm: '600px',
      /** Tablet */
      md: '800px',
      /** Desktop */
      lg: '1000px',
      /** Ultrawide and larger */
      xl: '1200px',
      /** Custom breakpoint for zoomed in screens (should trigger at about 200% zoom) */
      zoomed: { raw: '(max-width: 720px) and (max-height: 480px)' },
    },
    zIndex: {
      '-1': '-1',
      '0': '0',
      '1': '1',
    },
    extend: {
      borderColor: { DEFAULT: 'var(--scalar-border-color)' },
      brightness: {
        lifted: 'var(--scalar-lifted-brightness)',
        backdrop: 'var(--scalar-backdrop-brightness)',
      },
      spacing: {
        px: '1px',
        header: '48px',
        border: 'var(--scalar-border-width)',
      },
    },
  },
} satisfies Partial<Config>
