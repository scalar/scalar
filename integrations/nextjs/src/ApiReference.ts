import { getHtmlDocument } from '@scalar/core/libs/html-rendering'

import { customTheme } from './custom-theme'
import type { ApiReferenceConfiguration } from './types'

/**
 * The default configuration for the API Reference.
 */
const DEFAULT_CONFIGURATION: Partial<ApiReferenceConfiguration> = {
  _integration: 'nextjs',
}

/**
 * Next.js adapter for an Api Reference
 *
 * {@link https://github.com/scalar/scalar/tree/main/documentation/configuration.md Configuration}
 *
 * @params config - the Api Reference config object
 * @params options - reserved for future use to add customization to the response
 */
export const ApiReference = (givenConfiguration: Partial<ApiReferenceConfiguration>) => {
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
