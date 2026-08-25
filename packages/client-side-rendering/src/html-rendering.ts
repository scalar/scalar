import type { AnyApiReferenceConfiguration, HtmlRenderingConfiguration } from '@scalar/types/api-reference'

export type { AnyApiReferenceConfiguration, HtmlRenderingConfiguration }

/**
 * Default CDN URL for the @scalar/api-reference UMD standalone bundle.
 *
 * This is the classic build that registers a global `window.Scalar` and is loaded through a plain
 * `<script src="...">` tag. It stays the default so existing setups keep working unchanged.
 */
export const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'

/**
 * Default CDN URL for the @scalar/api-reference ESM standalone build (added in #9871).
 *
 * Used when `bundle` is enabled. It is loaded as a `<script type="module">`, so the browser only
 * downloads the lazy chunks the rendered page needs instead of the whole monolithic UMD bundle.
 */
export const DEFAULT_ESM_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js'

/**
 * Escape HTML special characters in user-provided strings.
 */
const escapeHtml = (str: string): string => {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Escape a value for use inside a double-quoted HTML attribute.
 *
 * On top of the regular HTML escaping we also encode double quotes so the value cannot break out of
 * the attribute. Used for the CSP nonce, which is attacker-influenced in some setups.
 */
const escapeHtmlAttribute = (str: string): string => escapeHtml(str).replace(/"/g, '&quot;')

/**
 * Build a ` nonce="..."` attribute (with a leading space) when a nonce is provided, otherwise an
 * empty string. Returned ready to be interpolated into a tag.
 */
const nonceAttribute = (nonce?: string): string => (nonce ? ` nonce="${escapeHtmlAttribute(nonce)}"` : '')

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
const getStyles = (configuration: Record<string, unknown>, customTheme: string, nonce?: string): string => {
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
    <style type="text/css"${nonceAttribute(nonce)}>
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
    /**
     * A Content Security Policy (CSP) nonce to apply to the generated inline `<script>` and `<style>`
     * tags (and the CDN `<script>` tag).
     *
     * When set, a `<meta property="csp-nonce">` tag is also emitted so the standalone bundle can apply
     * the same nonce to the stylesheet it injects at runtime. This lets the API Reference run under a
     * strict `script-src` with no `unsafe-inline` and no `unsafe-eval`.
     *
     * Note: `style-src` still needs `'unsafe-inline'`, because the reference renders inline
     * `style="..."` attributes that a CSP nonce cannot authorize.
     */
    nonce?: string
    /**
     * Load the modern ESM build instead of the classic UMD bundle.
     *
     * Pass `true` to load the default ESM entry (`DEFAULT_ESM_CDN`) as a `<script type="module">`, or
     * a URL string to point at a specific ESM build. When set, `bundle` takes precedence over `cdn`.
     */
    bundle?: string | boolean
  },
  customTheme = '',
): string {
  const { config: givenConfig, pageTitle, cdn, nonce } = options
  const title = escapeHtml(pageTitle ?? 'Scalar API Reference')

  const unwrapped = Array.isArray(givenConfig) ? givenConfig[0] : givenConfig
  // `bundle` may also arrive inside the config object (integrations spread unknown options into it),
  // so read it from there too and keep it out of the config that gets serialized to the client.
  const { customCss, theme, bundle: configBundle, ...rest } = (unwrapped ?? {}) as Record<string, unknown>
  const bundle = (options.bundle ?? configBundle) as string | boolean | undefined

  const configuration = getConfiguration({
    ...rest,
    ...(theme ? { theme } : {}),
    ...(customCss !== undefined ? { customCss } : {}),
  } as Record<string, unknown>)

  // Expose the nonce to the standalone bundle so it can apply it to the stylesheet it injects at
  // runtime (the bundle reads `meta[property=csp-nonce]` when built with `useStrictCSP`).
  const cspNonceMeta = nonce ? `\n    <meta property="csp-nonce" content="${escapeHtmlAttribute(nonce)}" />` : ''

  return `<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />${cspNonceMeta}${getStyles(configuration as Record<string, unknown>, customTheme, nonce)}
  </head>
  <body>
    <div id="app"></div>${getScriptTags(configuration, cdn, nonce, bundle)}
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
 * Serialize a configuration object to a JavaScript object literal string.
 *
 * Unlike `JSON.stringify`, this preserves function-valued properties (for example `onBeforeRequest`
 * or the request hooks) by emitting them as literal JavaScript source via `Function.prototype.toString()`.
 * That is what lets callbacks survive being written into an inline `<script>` tag, or across any other
 * boundary that would otherwise JSON-serialize the configuration and silently drop functions.
 *
 * Note: functions must be arrow functions or `function` expressions. Object method shorthand
 * (`onBeforeRequest(request) {}`) does not serialize to a valid standalone expression.
 */
export function serializeConfigToJs(configuration: Record<string, unknown>): string {
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

  const jsonString = JSON.stringify(restConfig, null, 2)
  const indentedJsonString = jsonString
    .split('\n')
    .map((line, index) => (index === 0 ? line : `      ${line}`))
    .join('\n')

  if (functionProps.length === 0) {
    return indentedJsonString
  }

  if (jsonString === '{}') {
    return `{\n        ${functionProps.join(',\n        ')}\n      }`
  }

  const jsonWithoutClosingBrace = indentedJsonString.split('\n').slice(0, -1).join('\n')
  return `${jsonWithoutClosingBrace},\n        ${functionProps.join(',\n        ')}\n      }`
}

/**
 * The script tag(s) to load the @scalar/api-reference package from the CDN and initialize it.
 *
 * By default this loads the classic UMD bundle via `<script src>` (from `cdn`, defaulting to
 * `DEFAULT_CDN`) and calls `Scalar.createApiReference`, which is unchanged from previous versions.
 *
 * Set `bundle` to opt into the modern ESM build instead: it is loaded as a `<script type="module">`
 * that imports `createApiReference` directly, so the browser only downloads the lazy chunks the page
 * needs rather than the whole monolithic UMD bundle. Pass `bundle: true` for the default ESM entry
 * (`DEFAULT_ESM_CDN`), or a URL string to point at a specific ESM build. `bundle` wins over `cdn`.
 *
 * When a `nonce` is provided it is applied to the script tag(s) so they are allowed under a strict
 * `script-src` Content Security Policy. In `bundle` mode the ESM build then loads its chunks through
 * the module loader, so a strict policy also needs `'strict-dynamic'` (or the CDN host allow-listed).
 */
export function getScriptTags(
  configuration: Record<string, unknown>,
  cdn?: string,
  nonce?: string,
  bundle?: string | boolean,
): string {
  const configString = serializeConfigToJs(configuration)

  const nonceAttr = nonceAttribute(nonce)

  if (bundle) {
    const esmUrl = typeof bundle === 'string' ? bundle : DEFAULT_ESM_CDN

    return `
    <!-- Load the Scalar API Reference -->
    <script type="module"${nonceAttr}>
      import { createApiReference } from '${esmUrl}'

      createApiReference('#app', ${configString})
    </script>`
  }

  return `
    <!-- Load the Script -->
    <script src="${cdn ?? DEFAULT_CDN}"${nonceAttr}></script>

    <!-- Initialize the Scalar API Reference -->
    <script type="text/javascript"${nonceAttr}>
      Scalar.createApiReference('#app', ${configString})
    </script>`
}

/**
 * The configuration to pass to the @scalar/api-reference package.
 */
export const getConfiguration = (
  givenConfiguration: Partial<HtmlRenderingConfiguration> | Record<string, unknown>,
): Record<string, unknown> => {
  const configuration = { ...givenConfiguration } as Record<string, unknown>

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
