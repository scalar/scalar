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
export const ApiReference = (refConfig: ReferenceConfiguration) => {
  const { spec, ...config } = refConfig

  // If no spec is passed, show a warning.
  if (!spec?.content && !spec?.url) {
    throw new Error(
      '[@scalar/nextjs-api-reference] You didn’t provide a spec.content or spec.url. Please provide one of these options.',
    )
  }

  const contentString = spec?.content
    ? typeof spec.content === 'function'
      ? JSON.stringify(spec.content())
      : JSON.stringify(spec.content)
    : ''

  // Add the default CSS
  if (!config?.customCss && !config?.theme) {
    config.customCss = nextjsThemeCss
  }

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
      ${contentString}
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
