import headlessPlugin from '@headlessui/tailwindcss'
import scalarPreset from '@scalar/themes/tailwind'
import { type Config } from 'tailwindcss'
import colorMix from 'tailwindcss-color-mix'

export default {
  presets: [scalarPreset],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx,vue}'],
  darkMode: ['selector', '.dark-mode'],
  theme: {
    extend: {
      colors: {
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
      },
      height: { header: 'var(--scalar-client-header-height)' },
      width: { sidebar: 'var(--scalar-sidebar-width)' },
      minHeight: { header: 'var(--scalar-client-header-height)' },
      zIndex: {
        // Numeric indexes
        10: '10',
        20: '20',
        50: '50',
        // Contextual overlays like dropdowns, popovers, tooltips
        context: '1000',
        // Full screen overlays / modals
        overlay: '10000',
      },
    },
  },
  plugins: [headlessPlugin, colorMix()],
} satisfies Config
