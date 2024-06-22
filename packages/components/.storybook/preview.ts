// Theming
import '@scalar/themes/base.css'
import '@scalar/themes/fonts.css'
import '@scalar/themes/presets/default.css'
import type { Preview } from '@storybook/vue3'

import '../src/tailwind/tailwind.css'
import './preview.css'

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
      classTarget: 'html',
      stylePreview: true,
      darkClass: 'dark-mode',
      lightClass: 'light-mode',
    },
    theme: {},
  },
}

export default preview
