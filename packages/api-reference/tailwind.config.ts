import scalarPreset from '@scalar/themes/tailwind'
import { type Config } from 'tailwindcss'

export default {
  presets: [scalarPreset],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx,vue}'],
  corePlugins: { preflight: false },
  darkMode: ['selector', '.dark-mode'],
} satisfies Config
