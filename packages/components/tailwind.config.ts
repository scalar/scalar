import headlessPlugin from '@headlessui/tailwindcss'
import scalarPreset from '@scalar/themes/tailwind'
import type { Config } from 'tailwindcss'
import colorMix from 'tailwindcss-color-mix'
import plugin from 'tailwindcss/plugin'

export default {
  presets: [scalarPreset],
  content: ['./src/**/*.{vue,ts}'],
  corePlugins: { preflight: false },
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
          border: 'var(--scalar-sidebar-border-color, var(--scalar-border-color))',
          indent: {
            border: 'var(--scalar-sidebar-indent-border, var(--scalar-border-color))',
            hover: 'var(--scalar-sidebar-indent-border-hover, var(--scalar-border-color))',
            active: 'var(--scalar-sidebar-indent-border-active, var(--scalar-color-accent))',
          },
          search: {
            b: 'var(--scalar-sidebar-search-background, var(--scalar-background-2))',
            c: 'var(--scalar-sidebar-search-color, var(--scalar-color-3))',
            border: 'var(--scalar-sidebar-search-border-color, var(--scalar-border-color))',
          },
        },
      },
      maxWidth: {
        'screen-xxs': '360px',
        'screen-xs': '480px',
        'screen-sm': '540px',
        'screen-md': '640px',
        'screen-lg': '800px',
        'screen-xl': '1000px',
        'radix-popper': 'calc(var(--radix-popper-available-width) - 8px)',
      },
      maxHeight: {
        'radix-popper': 'calc(var(--radix-popper-available-height) - 8px)',
      },
      zIndex: {
        // Contextual overlays like dropdowns, popovers, tooltips
        context: '1000',
        // Just above context
        'context-plus': '1001',
        // Full screen overlays / modals
        overlay: '10000',
        // Tooltip
        tooltip: '99999',
      },
    },
  },
} satisfies Config
