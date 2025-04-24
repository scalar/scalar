import { getHtmlDocument } from '@scalar/core/libs/html-rendering'

import { customTheme } from './custom-theme.js'
import type { ApiReferenceConfiguration } from './types.js'

/**
 * The default configuration for the API Reference.
 */
const DEFAULT_CONFIGURATION: Partial<ApiReferenceConfiguration> = {
  // TODO: Must be available in the CDN version
  // _integration: 'svelte',
}

/**
 * SvelteKit adapter for an API Reference
 *
 * {@link https://github.com/scalar/scalar/tree/main/documentation/configuration.md Configuration}
 */
export const ScalarApiReference = (givenConfiguration: Partial<ApiReferenceConfiguration>) => {
  // Merge the defaults
  const configuration = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  } satisfies Partial<ApiReferenceConfiguration>

  return async () => {
    return new Response(getHtmlDocument(configuration, customTheme), {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}
