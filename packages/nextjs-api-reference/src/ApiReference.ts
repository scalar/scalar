import type { ReferenceConfiguration } from '@scalar/api-reference'

import { nextjsThemeCss } from './theme'

/**
 * Next.js adapter for an Api Reference
 *
 * {@link https://github.com/scalar/scalar?tab=readme-ov-file#configuration Configuration}
 *
 * @params config - the Api Reference config object
 * @params options - reserved for future use to add customization to the response
 */
export const ApiReference = (config: ReferenceConfiguration) => {
  // If no spec is passed, show a warning.
  if (!config.spec?.content && !config.spec?.url) {
    throw new Error(
      '[@scalar/nextjs-api-reference] You didn’t provide a spec.content or spec.url. Please provide one of these options.',
    )
  }

  // Execute content function if it exists
  if (typeof config.spec?.content === 'function') {
    config.spec.content = config.spec.content()
  }

  // Convert the document to a string
  const documentString = config?.spec?.content
    ? typeof config?.spec?.content === 'string'
      ? config.spec.content
      : JSON.stringify(config.spec.content)
    : ''

  // Delete content from configuration
  if (config?.spec?.content) {
    delete config.spec.content
  }

  // Add the default CSS
  if (!config?.customCss && !config?.theme) {
    config.customCss = nextjsThemeCss
  }

  // Convert the configuration to a string
  const configString = JSON.stringify(config ?? {})
    .split('"')
    .join('&quot;')

  return async () => {
    return new Response(
      `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scalar API Reference</title>
  </head>
  <body>
    <script
      id="api-reference"
      type="application/json"
      data-configuration="${configString}">
      ${documentString}
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      },
    )
  }
}
