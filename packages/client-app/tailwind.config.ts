import headlessPlugin from '@headlessui/tailwindcss'
import { type Config } from 'tailwindcss'
import colorMix from 'tailwindcss-color-mix'

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx,vue}'],
  darkMode: ['selector', '.dark-mode'],
  theme: {
    boxShadow: {
      DEFAULT: 'var(--scalar-shadow-1)',
      lg: 'var(--scalar-shadow-2)',
      md: 'var(--scalar-shadow-1)',
      sm: 'rgba(0, 0, 0, 0.09) 0px 1px 4px',
      inset: 'inset 0 0 0 1px var(--scalar-border-color)',
      insetsm: 'inset 0 0 0 .5px var(--scalar-border-color)',
      none: '0 0 #0000',
    },
    fontFamily: {
      DEFAULT: 'var(--scalar-font)',
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
      medium: 'var(--scalar-semibold)',
      bold: 'var(--scalar-bold)',
    },
    colors: {
      current: 'currentColor',
      // Backdrop Colors
      b: {
        1: 'var(--scalar-background-1)',
        2: 'var(--scalar-background-2)',
        3: 'var(--scalar-background-3)',
        4: 'var(--scalar-background-3)',
        accent: 'var(--scalar-background-accent)',
        btn: 'var(--scalar-button-1)',
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
      },

      // Hover Colors
      h: {
        btn: 'var(--scalar-button-1-hover)',
      },

      // Sidebar
      sidebar: {
        b: {
          1: 'var(--scalar-sidebar-background-1, var(--scalar-background-1))',
        },
        c: {
          1: 'var(--scalar-sidebar-color-1, var(--scalar-color-1))',
          2: 'var(--scalar-sidebar-color-2, var(--scalar-color-2))',
        },
        h: {
          b: 'var(--scalar-sidebar-item-hover-background, var(--scalar-background-2))',
          c: 'var(--scalar-sidebar-item-hover-color, currentColor)',
        },
        active: {
          b: 'var(--scalar-sidebar-item-active-background, var(--scalar-background-2))',
          c: 'var(--scalar-sidebar-color-active, currentColor)',
        },
        border:
          'var(--scalar-sidebar-border-color, var(--scalar-border-color))',
        search: {
          b: 'var(--scalar-sidebar-search-background, var(--scalar-background-2))',
          c: 'var(--scalar-sidebar-search-color, var(--scalar-color-3))',
          border:
            'var(--scalar-sidebar-search-border-color, var(--scalar-border-color))',
        },
      },

      // Utility Colors
      backdrop: 'rgba(0, 0, 0, 0.44)', // Overlay Backdrops
      border: 'var(--scalar-border-color)',
      brand: 'var(--scalar-brand)',

      // Themed Primary Colors
      green: 'var(--scalar-color-green)',
      red: 'var(--scalar-color-red)',
      yellow: 'var(--scalar-color-yellow)',
      blue: 'var(--scalar-color-blue)',
      orange: 'var(--scalar-color-orange)',
      purple: 'var(--scalar-color-purple)',
      grey: 'var(--scalar-color-grey)',
      indigo: 'var(--scalar-color-blue)',
      pink: 'var(--scalar-color-pink)',

      // Control Colors
      error: 'var(--scalar-error-color)',

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
      xs: '400px',
      sm: '600px',
      md: '800px',
      lg: '1000px',
      xl: '1200px',
    },
    extend: {
      borderRadius: {
        DEFAULT: 'var(--scalar-radius)',
        md: 'var(--scalar-radius)',
        lg: 'var(--scalar-radius-lg)',
        xl: 'var(--scalar-radius-xl)',
      },
      height: { header: 'var(--scalar-client-header-height)' },
      width: { sidebar: 'var(--scalar-sidebar-width)' },
      minHeight: { header: 'var(--scalar-client-header-height)' },
      borderColor: { DEFAULT: 'var(--scalar-border-color)' },
      borderWidth: {
        'DEFAULT': 'var(--scalar-border-width)',
        '1/2': 'calc(var(--scalar-border-width) / 2)',
      },
      brightness: {
        lifted: 'var(--scalar-lifted-brightness)',
        backdrop: 'var(--scalar-backdrop-brightness)',
      },
      zIndex: {
        '-1': '-1',
        '0': '0',
        '1': '1',
      },
    },
  },
  plugins: [headlessPlugin, colorMix()],
} satisfies Config
