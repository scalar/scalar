import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'

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
const getStyles = (configuration: Record<string, unknown>, customTheme: string): string => {
  const styles: string[] = []

  if (configuration.customCss) {
    styles.push('/* Custom CSS */')
    styles.push(configuration.customCss as string)
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
 * Render the Scalar API Reference as a complete HTML document using the CDN.
 *
 * Generates static HTML that loads the @scalar/api-reference standalone bundle
 * from a CDN and renders client-side. No server-side dependencies required.
 *
 * For server-side rendering with hydration, use the server module instead.
 */
export function renderApiReference(
  options: {
    /** The API reference configuration. */
    config: AnyApiReferenceConfiguration
    /** Page title. Defaults to "Scalar API Reference". */
    pageTitle?: string
    /** CDN URL for the standalone bundle. Defaults to jsDelivr. */
    cdn?: string
  },
  customTheme = '',
): string {
  const { config: givenConfig, pageTitle, cdn } = options

  const unwrapped = Array.isArray(givenConfig) ? givenConfig[0] : givenConfig
  const { customCss, theme, ...rest } = (unwrapped ?? {}) as Record<string, unknown>

  const configuration = getConfiguration({
    ...rest,
    ...(theme ? { theme } : {}),
    customCss,
  } as Record<string, unknown>)

  return `<!doctype html>
<html>
  <head>
    <title>${pageTitle ?? 'Scalar API Reference'}</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />${getStyles(configuration as Record<string, unknown>, customTheme)}
  </head>
  <body>
    <div id="app"></div>${getScriptTags(configuration, cdn)}
  </body>
</html>`
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
export function getScriptTags(configuration: Record<string, unknown>, cdn?: string): string {
  const restConfig = { ...configuration }

  const functionProps: string[] = []

  for (const [key, value] of Object.entries(configuration)) {
    if (typeof value === 'function') {
      functionProps.push(`"${key}": ${value.toString()}`)
      delete restConfig[key]
    } else if (Array.isArray(value) && value.some((item) => typeof item === 'function')) {
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
    <script src="${cdn ?? DEFAULT_CDN}"></script>

    <!-- Initialize the Scalar API Reference -->
    <script type="text/javascript">
      Scalar.createApiReference('#app', ${configString}${functionPropsString})
    </script>`
}

/**
 * The configuration to pass to the @scalar/api-reference package.
 */
export const getConfiguration = (givenConfiguration: Record<string, unknown>): Record<string, unknown> => {
  const configuration = { ...givenConfiguration }

  // Execute content if it's a function
  if (typeof configuration.content === 'function') {
    configuration.content = (configuration.content as () => unknown)()
  }

  // Only remove content if url is provided
  if (configuration.content && configuration.url) {
    delete configuration.content
  }

  return configuration
}
