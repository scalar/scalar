import { type Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

import { extend, theme } from './src/tailwind'

export default {
  content: ['./src/**/*.{vue,ts}'],
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('has-actv-btn', '&:has(button:active)')
      addVariant('!empty', '&:not(:empty)')
      addVariant('hocus', ['&:hover', '&:focus-visible'])
    }),
  ],
  theme: {
    ...theme,
    extend,
  },
} satisfies Config
