import scalarPreset from '@scalar/themes/tailwind'
import type { Config } from 'tailwindcss'

export default {
  presets: [scalarPreset],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx,vue}'],
  corePlugins: { preflight: false },
  darkMode: ['selector', '.dark-mode'],
  theme: {
    extend: {
      zIndex: {
        // Numeric indexes
        10: '10',
        20: '20',
        50: '50',
        // Contextual overlays like dropdowns, popovers, tooltips
        'context': '1000',
        // Just above context
        'context-plus': '1001',
        // Full screen overlays / modals
        'overlay': '10000',
      },
    },
  },
} satisfies Config
