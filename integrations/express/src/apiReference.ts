import { getHtmlDocument } from '@scalar/core/libs/html-rendering'
import type { RequestHandler } from 'express'

import type { ApiReferenceConfiguration } from './types'

/**
 * The default configuration for the API Reference.
 */
const DEFAULT_CONFIGURATION: Partial<ApiReferenceConfiguration> = {
  _integration: 'express',
}

/**
 * The route handler to render the Scalar API Reference.
 */
export function apiReference(givenConfiguration: Partial<ApiReferenceConfiguration>): RequestHandler<never, string> {
  // Merge the defaults
  const configuration = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  }

  // Respond with the HTML document
  return (_, res) => {
    res.type('text/html').send(getHtmlDocument(configuration))
  }
}
