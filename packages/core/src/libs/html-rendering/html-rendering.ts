import {
  type ApiReferenceConfiguration,
  type HtmlRenderingConfiguration,
  apiReferenceConfigurationSchema,
  htmlRenderingConfigurationSchema,
} from '@scalar/types/api-reference'

// Re-export the type for convenience
export type { HtmlRenderingConfiguration }

/**
 * Helper function to add consistent indentation to multiline strings
 */
const addIndent = (str: string, spaces: number = 2): string => {
  const indent = ' '.repeat(spaces)
  return str.split('\n').join(`\n${indent}`)
}

/**
 * Generate the style tag with custom theme if needed
 */
const getStyles = (configuration: Partial<HtmlRenderingConfiguration>, customTheme: string): string => {
  if (configuration.theme || !customTheme) {
    return ''
  }

  return `
        <style type="text/css">
          ${addIndent(customTheme, 10)}
        </style>`
}

/**
 * The HTML document to render the Scalar API reference.
 *
 * We must check the passed in configuration and not the configuration for the theme as the configuration will have it
 * defaulted to 'default'
 */
export const getHtmlDocument = (givenConfiguration: Partial<HtmlRenderingConfiguration>, customTheme = '') => {
  const { cdn, pageTitle, ...rest } = givenConfiguration

  const parsedHtmlOptions = htmlRenderingConfigurationSchema.parse({ cdn, pageTitle, customTheme })
  const parsedConfiguration = apiReferenceConfigurationSchema.parse(rest)

  // Use getConfiguration to properly handle content/url
  const configuration = getConfiguration(parsedConfiguration)

  return `
    <!doctype html>
    <html>
      <head>
        <title>${parsedHtmlOptions.pageTitle || 'Scalar API Reference'}</title>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1" />
        ${getStyles(configuration, customTheme)}
      </head>
      <body>
        <div id="app"></div>
        ${getScriptTags(configuration, parsedHtmlOptions.cdn)}
      </body>
    </html>
  `
}

/**
 * The script tags to load the @scalar/api-reference package from the CDN.
 */
export function getScriptTags(configuration: Partial<ApiReferenceConfiguration>, cdn: string) {
  return `
        <!-- Load the Script -->
        <script src="${cdn}"></script>

        <!-- Initialize the Scalar API Reference -->
        <script type="text/javascript">
          Scalar.createApiReference('#app', ${JSON.stringify(configuration, null, 2).split('\n').join('\n          ')})
        </script>`
}

/**
 * The configuration to pass to the @scalar/api-reference package.
 */
export const getConfiguration = (
  givenConfiguration: Partial<ApiReferenceConfiguration>,
): Partial<ApiReferenceConfiguration> => {
  // Clone the given configuration
  const configuration = {
    ...givenConfiguration,
  }

  // Only remove content if url is provided
  if (configuration.content && configuration.url) {
    delete configuration.content
  }

  // Just return regular JSON string, no HTML escaping needed
  return configuration
}
