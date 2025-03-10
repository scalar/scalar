import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { nextjsThemeCss } from './theme'

export type ApiReferenceOptions = Partial<ApiReferenceConfiguration> & {
  cdn?: string
}

/**
 * Next.js adapter for an Api Reference
 *
 * {@link https://github.com/scalar/scalar/tree/main/documentation/configuration.md Configuration}
 *
 * @params config - the Api Reference config object
 * @params options - reserved for future use to add customization to the response
 */
export const ApiReference = (config: ApiReferenceOptions) => {
  // If no spec is passed, show a warning.
  if (!config.content && !config.url) {
    throw new Error(
      '[@scalar/nextjs-api-reference] You didn’t provide a content or url. Please provide one of these options.',
    )
  }

  // Execute content function if it exists
  if (typeof config.content === 'function') {
    config.content = config.content()
  }

  // Convert the document to a string
  const documentString = config?.content
    ? typeof config?.content === 'string'
      ? config.content
      : JSON.stringify(config.content)
    : ''

  // Delete content from configuration
  if (config?.content) {
    delete config.content
  }

  // Add the default CSS
  if (!config?.customCss && !config?.theme) {
    config.customCss = nextjsThemeCss
  }

  // Check the config for a custom CDN string or set to default
  const cdnString = config?.cdn ? config.cdn : 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest'

  // Add _integration: 'nextjs' to the configuration, but allow user to overwrite.
  const defaultConfiguration = {
    _integration: 'nextjs',
  }

  // Convert the configuration to a string
  const configString = JSON.stringify({
    ...defaultConfiguration,
    ...(config ?? {}),
  })
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
    <script src="${cdnString}"></script>
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
