import type { ApiReferenceConfiguration, HtmlRenderingConfiguration } from '@scalar/types/api-reference'

// Re-export the type for convenience
export type { HtmlRenderingConfiguration }

/**
 * Helper function to add consistent indentation to multiline strings
 * @param str The string to indent
 * @param spaces Number of spaces for each level
 * @param initialIndent Whether to indent the first line
 */
const addIndent = (str: string, spaces: number = 2, initialIndent: boolean = false): string => {
  const indent = ' '.repeat(spaces)
  const lines = str.split('\n')
  return lines
    .map((line, index) => {
      if (index === 0 && !initialIndent) {
        return line
      }
      return `${indent}${line}`
    })
    .join('\n')
}

/**
 * Generate the style tag with custom theme if needed
 */
const getStyles = (configuration: Partial<HtmlRenderingConfiguration>, customTheme: string): string => {
  const styles: string[] = []

  if (configuration.customCss) {
    styles.push('/* Custom CSS */')
    styles.push(configuration.customCss)
  }

  if (!configuration.theme && customTheme) {
    styles.push('/* Custom Theme */')
    styles.push(customTheme)
  }

  if (styles.length === 0) {
    return ''
  }

  return `
    <style type="text/css">
      ${addIndent(styles.join('\n\n'), 6)}
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

  const configuration = getConfiguration({
    ...rest,
    ...(theme ? { theme } : {}),
    customCss,
  })

  const content = `<!doctype html>
<html>
  <head>
    <title>${pageTitle ?? 'Scalar API Reference'}</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />${getStyles(configuration, customTheme)}
  </head>
  <body>
    <div id="app"></div>${getScriptTags(configuration, cdn)}
  </body>
</html>`

  return content
}

/**
 * Helper function to serialize arrays that may contain functions
 */
const serializeArrayWithFunctions = (arr: unknown[]): string => {
  return `[${arr.map((item) => (typeof item === 'function' ? item.toString() : JSON.stringify(item))).join(', ')}]`
}

/**
 * The script tags to load the @scalar/api-reference package from the CDN.
 */
export function getScriptTags(configuration: Partial<ApiReferenceConfiguration>, cdn?: string) {
  const restConfig = { ...configuration }

  const functionProps: string[] = []

  for (const [key, value] of Object.entries(configuration) as [keyof typeof configuration, unknown][]) {
    if (typeof value === 'function') {
      functionProps.push(`"${key}": ${value.toString()}`)
      delete restConfig[key]
    } else if (Array.isArray(value) && value.some((item) => typeof item === 'function')) {
      // Handle arrays that contain functions (like plugins)
      functionProps.push(`"${key}": ${serializeArrayWithFunctions(value)}`)
      delete restConfig[key]
    }
  }

  // Stringify the rest of the configuration
  const configString = JSON.stringify(restConfig, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : '      ' + line))
    .join('\n')
    .replace(/\s*}$/, '') // Remove the closing brace and any whitespace before it

  const functionPropsString = functionProps.length ? `,\n        ${functionProps.join(',\n        ')}\n      }` : '}'

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
