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
