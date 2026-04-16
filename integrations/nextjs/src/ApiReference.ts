import { renderApiReference } from '@scalar/client-side-rendering'

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
export const ApiReference = (givenConfiguration: Partial<ApiReferenceConfiguration>): (() => Response) => {
  // Merge the defaults
  const configuration: Partial<ApiReferenceConfiguration> = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  }

  return () => {
    const { cdn, pageTitle, ...config } = configuration
    const referenceDocument = renderApiReference({ config, pageTitle, cdn }, customTheme)
    return new Response(referenceDocument, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
