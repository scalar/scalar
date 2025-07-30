import { getHtmlDocument } from '@scalar/core/libs/html-rendering'
import type { Request, Response } from 'express'

import type { ApiReferenceConfiguration } from './types'

/**
 * The custom theme CSS for the Express theme
 *
 * @deprecated we have removed this custom theme, the variable is just here because it is exported
 */
export const customTheme = ''

/**
 * The default configuration for the API Reference.
 */
const DEFAULT_CONFIGURATION: Partial<ApiReferenceConfiguration> = {
  _integration: 'express',
}

/**
 * The route handler to render the Scalar API Reference.
 */
export function apiReference(givenConfiguration: Partial<ApiReferenceConfiguration>) {
  // Merge the defaults
  const configuration = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  }

  // Respond with the HTML document
  return (_: Request, res: Response) => {
    res.type('text/html').send(getHtmlDocument(configuration, customTheme))
  }
}
