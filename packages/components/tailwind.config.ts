import { type Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

import scalarPreset from './tailwind.preset'

export default {
  presets: [scalarPreset],
  content: ['./src/**/*.{vue,ts}'],
  corePlugins: {
    preflight: false,
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('has-actv-btn', '&:has(button:active)')
      addVariant('!empty', '&:not(:empty)')
      addVariant('hocus', ['&:hover', '&:focus-visible'])
    }),
  ],
  theme: {
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
    extend: {
      maxWidth: {
        'screen-xs': '480px',
        'screen-sm': '540px',
        'screen-md': '640px',
        'screen-lg': '800px',
      },
      zIndex: {
        // Contextual overlays like dropdowns, popovers, tooltips
        context: '1000',
        // Full screen overlays / modals
        overlay: '10000',
      },
    },
  },
} satisfies Config
