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
  // If theme is set, don’t include any custom CSS
  if (configuration.theme !== 'default') {
    return ''
  }

  const styles: string[] = []

  // Add customCss if provided
  if (configuration.customCss) {
    styles.push(configuration.customCss)
  }

  // Add customTheme if provided
  if (customTheme) {
    styles.push(customTheme)
  }

  // If no styles, return empty string
  if (styles.length === 0) {
    return ''
  }

  return `
        <style type="text/css">
          ${addIndent(styles.join('\n'), 10)}
        </style>`
}

/**
 * The HTML document to render the Scalar API reference.
 *
 * We must check the passed in configuration and not the configuration for the theme as the configuration will have it
 * defaulted to 'default'
 */
export const getHtmlDocument = (givenConfiguration: Partial<HtmlRenderingConfiguration>, customTheme = '') => {
  const { cdn, pageTitle, customCss, theme, ...rest } = givenConfiguration

  const parsedHtmlOptions = htmlRenderingConfigurationSchema.parse({ cdn, pageTitle })
  const parsedConfiguration = apiReferenceConfigurationSchema.parse({
    ...rest,
    // Only include theme if it was explicitly provided
    ...(theme ? { theme } : {}),
    customCss,
  })

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

  // Execute content if it's a function
  if (typeof configuration.content === 'function') {
    configuration.content = configuration.content()
  }

  // Only remove content if url is provided
  if (configuration.content && configuration.url) {
    delete configuration.content
  }

  // Just return regular JSON string, no HTML escaping needed
  return configuration
}
