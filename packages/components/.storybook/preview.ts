// Theming
import '@scalar/themes/fonts.css'
import '@scalar/themes/style.css'

import type { Preview } from '@storybook/vue3-vite'

import '../src/style.css'
import './preview.css'

document.body.classList.add('scalar-app')
document.body.classList.add('light-mode')

const preview: Preview = {
  parameters: {
    backgrounds: {
      // disable: true,
      grid: { disable: true },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      presetColors: [
        { title: '--scalar-color-1', color: 'var(--scalar-color-1)' },
        { title: '--scalar-color-2', color: 'var(--scalar-color-2)' },
        { title: '--scalar-color-3', color: 'var(--scalar-color-3)' },
        { title: '--scalar-color-accent', color: 'var(--scalar-color-accent)' },
        { title: '--scalar-background-1', color: 'var(--scalar-background-1)' },
        { title: '--scalar-background-2', color: 'var(--scalar-background-2)' },
        { title: '--scalar-background-3', color: 'var(--scalar-background-3)' },
        { title: '--scalar-background-accent', color: 'var(--scalar-background-accent)' },
        { title: '--scalar-border-color', color: 'var(--scalar-border-color)' },
        { title: '--scalar-color-green', color: 'var(--scalar-color-green)' },
        { title: '--scalar-color-red', color: 'var(--scalar-color-red)' },
        { title: '--scalar-color-yellow', color: 'var(--scalar-color-yellow)' },
        { title: '--scalar-color-blue', color: 'var(--scalar-color-blue)' },
        { title: '--scalar-color-orange', color: 'var(--scalar-color-orange)' },
        { title: '--scalar-color-purple', color: 'var(--scalar-color-purple)' },
        { title: '--scalar-color-alert', color: 'var(--scalar-color-alert)' },
        { title: '--scalar-color-danger', color: 'var(--scalar-color-danger)' },
      ],
    },
    darkMode: {
      classTarget: 'body',
      stylePreview: true,
      darkClass: 'dark-mode',
      lightClass: 'light-mode',
    },
    theme: {},
  },
}

export default preview
