// Theming
import '@scalar/themes/style.css'
import '@scalar/themes/fonts.css'

import type { Preview } from '@storybook/vue3'

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
