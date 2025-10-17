import { getHtmlDocument } from '@scalar/core/libs/html-rendering'

import { customTheme } from './custom-theme.js'
import type { ApiReferenceConfiguration } from './types.js'

/**
 * The default configuration for the API Reference.
 */
const DEFAULT_CONFIGURATION: Partial<ApiReferenceConfiguration> = {
  _integration: 'svelte',
}

/**
 * SvelteKit adapter for an API Reference
 *
 * {@link https://github.com/scalar/scalar/tree/main/documentation/configuration.md Configuration}
 */
export const ScalarApiReference = (givenConfiguration: Partial<ApiReferenceConfiguration>): (() => Response) => {
  // Merge the defaults
  const configuration: Partial<ApiReferenceConfiguration> = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  }

  return () => {
    const referenceDocument = getHtmlDocument(configuration, customTheme)
    return new Response(referenceDocument, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
