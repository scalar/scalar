import type { ApiReferenceConfiguration, HtmlRenderingConfiguration } from '@scalar/types/api-reference'

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
  const styles: string[] = []

  // Add customCss if provided
  if (configuration.customCss) {
    styles.push(configuration.customCss)
  }

  // Add customTheme if provided (if no theme is set)
  if (!configuration.theme && customTheme) {
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

  // Use getConfiguration to properly handle content/url
  const configuration = getConfiguration({
    ...rest,
    // Only include theme if it was explicitly provided
    ...(theme ? { theme } : {}),
    customCss,
  })

  return `
    <!doctype html>
    <html>
      <head>
        <title>${pageTitle ?? 'Scalar API Reference'}</title>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1" />
        ${getStyles(configuration, customTheme)}
      </head>
      <body>
        <div id="app"></div>
        ${getScriptTags(configuration, cdn)}
      </body>
    </html>
  `
}

/**
 * The script tags to load the @scalar/api-reference package from the CDN.
 */
export function getScriptTags(configuration: Partial<ApiReferenceConfiguration>, cdn?: string) {
  // Extract function properties before stringifying
  const {
    tagsSorter,
    operationsSorter,
    generateHeadingSlug,
    generateModelSlug,
    generateTagSlug,
    generateOperationSlug,
    generateWebhookSlug,
    onLoaded,
    redirect,
    onSpecUpdate,
    onServerChange,
    ...restConfig
  } = configuration

  // Create the function strings if they exist
  const functionProps: string[] = []
  const functionProperties = [
    { name: 'tagsSorter', value: tagsSorter },
    { name: 'operationsSorter', value: operationsSorter },
    { name: 'generateHeadingSlug', value: generateHeadingSlug },
    { name: 'generateModelSlug', value: generateModelSlug },
    { name: 'generateTagSlug', value: generateTagSlug },
    { name: 'generateOperationSlug', value: generateOperationSlug },
    { name: 'generateWebhookSlug', value: generateWebhookSlug },
    { name: 'onLoaded', value: onLoaded },
    { name: 'redirect', value: redirect },
    { name: 'onSpecUpdate', value: onSpecUpdate },
    { name: 'onServerChange', value: onServerChange },
  ]

  functionProperties.forEach(({ name, value }) => {
    if (value && typeof value === 'function') {
      functionProps.push(`${name}: ${value.toString()}`)
    }
  })

  // Stringify the rest of the configuration with no initial indentation
  const configString = JSON.stringify(restConfig, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : '            ' + line))
    .join('\n')
    .replace(/}$/, '') // Remove the closing brace

  const functionPropsString = functionProps.length
    ? ',\n            ' + functionProps.join(',\n            ') + '\n          }'
    : '}'

  return `
        <!-- Load the Script -->
        <script src="${cdn ?? 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'}"></script>

        <!-- Initialize the Scalar API Reference -->
        <script type="text/javascript">
          Scalar.createApiReference('#app', ${configString}${functionPropsString})
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
