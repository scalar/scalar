import headlessPlugin from '@headlessui/tailwindcss'
import scalarPreset from '@scalar/themes/tailwind'
import { type Config } from 'tailwindcss'
import colorMix from 'tailwindcss-color-mix'
import plugin from 'tailwindcss/plugin'

export default {
  presets: [scalarPreset],
  content: ['./src/**/*.{vue,ts}'],
  corePlugins: {
    preflight: false,
  },
  plugins: [
    headlessPlugin,
    colorMix(),
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
