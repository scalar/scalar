import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import type { StorybookConfig } from '@storybook/vue3-vite'

const require = createRequire(import.meta.url)

/**
 * Resolves the absolute path of a package.
 *
 * Needed in a monorepo so Storybook loads the workspace copy of each addon rather than trying to
 * hoist its own.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  // Only schema stories for now. The glob is left broad so future component stories are picked up
  // without touching this config.
  stories: ['../src/**/*.stories.ts'],

  addons: [getAbsolutePath('@storybook/addon-links'), getAbsolutePath('@storybook/addon-docs')],

  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    options: {},
  },
}

export default config
