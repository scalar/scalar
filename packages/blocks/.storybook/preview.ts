// Theming
import '@scalar/themes/fonts.css'

import type { Preview } from '@storybook/vue3-vite'

// Blocks supplies the theme tokens, reset, and schema utilities used by its consumers.
import '../src/style.css'
import './preview.css'

import { applyScalarGlobals, scalarGlobalTypes, scalarInitialGlobals } from '@scalar/helpers/storybook/globals'

document.body.classList.add('scalar-app')

const preview: Preview = {
  globalTypes: scalarGlobalTypes,

  /**
   * Storybook drops any global that is not declared here, so this is what lets the visual tests
   * select a theme with `?globals=theme:laserwave` on the story URL.
   */
  initialGlobals: scalarInitialGlobals,

  decorators: [
    (story, context) => {
      applyScalarGlobals(context.globals)
      return story()
    },
  ],

  parameters: {
    backgrounds: {
      grid: { disable: true },
    },
    theme: {},
  },
}

export default preview
