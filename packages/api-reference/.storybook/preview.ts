// Theming
import '@scalar/themes/fonts.css'

import type { Preview } from '@storybook/vue3-vite'

// The api reference global styles pull in `@scalar/themes/style.css` and the Tailwind theme, so the
// stories render with the exact same tokens and reset the reference itself uses.
import '../src/style.css'
import './preview.css'

import { type ThemeVariantId, applyThemeVariant, defaultThemeVariant, themeVariants } from './themes'

document.body.classList.add('scalar-app')
document.body.classList.add('light-mode')

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Scalar theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: Object.entries(themeVariants).map(([value, { label }]) => ({ value, title: label })),
        dynamicTitle: true,
      },
    },
  },

  /**
   * Storybook drops any global that is not declared here, so this is what lets the visual tests
   * select a theme with `?globals=theme:square` on the story URL.
   */
  initialGlobals: {
    theme: defaultThemeVariant,
  },

  decorators: [
    (story, context) => {
      applyThemeVariant(context.globals.theme as ThemeVariantId)
      return story()
    },
  ],

  parameters: {
    backgrounds: {
      grid: { disable: true },
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
