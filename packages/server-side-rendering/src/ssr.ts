import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

import { ApiReference } from '@scalar/api-reference'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { createHead, renderSSRHead } from '@unhead/vue/server'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

const require = createRequire(import.meta.url)

/**
 * Unwrap the configuration from an array if needed, since AnyApiReferenceConfiguration
 * can be a single config or an array of configs.
 */
function unwrapConfig(configuration: AnyApiReferenceConfiguration): Record<string, unknown> {
  const config = Array.isArray(configuration) ? configuration[0] : configuration
  return (config ?? {}) as Record<string, unknown>
}

function parseForceDarkModeState(config: Record<string, unknown>): 'dark' | 'light' | null {
  const forced = config.forceDarkModeState

  if (forced === 'dark' || forced === 'light') {
    return forced
  }

  return null
}

function parseDarkMode(config: Record<string, unknown>): boolean | null {
  return typeof config.darkMode === 'boolean' ? config.darkMode : null
}

/**
 * Generate an inline script that detects the user's color mode preference
 * and applies the correct class to <body> before content paints.
 *
 * Place this script before the app container in your HTML so it runs before
 * the first paint without interfering with Vue hydration.
 *
 * Priority:
 * 1. forceDarkModeState → always wins (no runtime detection)
 * 2. localStorage 'colorMode' → user's saved preference
 * 3. matchMedia system preference
 * 4. darkMode config → explicit default
 * 5. Fallback → light-mode
 */
export function generateBodyScript(configuration: AnyApiReferenceConfiguration): string {
  const config = unwrapConfig(configuration)
  const forced = parseForceDarkModeState(config)
  const darkMode = parseDarkMode(config)

  /** When forceDarkModeState is set, we do not need runtime detection at all. */
  if (forced) {
    return `<script>(function(){var cl=document.body.classList;cl.remove('dark-mode','light-mode');cl.add('${forced === 'dark' ? 'dark-mode' : 'light-mode'}')})()</script>`
  }

  /**
   * Runtime detection script: checks localStorage first, then system preference,
   * then falls back to the darkMode config value.
   */
  const fallback =
    darkMode === null ? `set(window.matchMedia('(prefers-color-scheme:dark)').matches)` : `set(${darkMode})`

  return `<script>(function(){var cl=document.body.classList;function set(d){cl.remove('dark-mode','light-mode');cl.add(d?'dark-mode':'light-mode')}try{var s=localStorage.getItem('colorMode');if(s==='dark'||s==='light'){set(s==='dark');return}}catch(e){}${fallback}})()</script>`
}

/**
 * Derive the initial SSR class for <body> from config.
 *
 * Priority:
 * 1. forceDarkModeState
 * 2. darkMode
 * 3. fallback to dark-mode (then runtime script can refine from localStorage/matchMedia)
 */
function getInitialBodyClass(configuration: AnyApiReferenceConfiguration): 'dark-mode' | 'light-mode' {
  const config = unwrapConfig(configuration)
  const forced = parseForceDarkModeState(config)
  const darkMode = parseDarkMode(config)

  if (forced) {
    return forced === 'dark' ? 'dark-mode' : 'light-mode'
  }

  if (darkMode !== null) {
    return darkMode ? 'dark-mode' : 'light-mode'
  }

  return 'dark-mode'
}

type RenderedSsrHead = Awaited<ReturnType<typeof renderSSRHead>>

const createHeadInstance = (pageTitle?: string) => createHead(pageTitle ? { init: [{ title: pageTitle }] } : undefined)

/**
 * Ensure the initial body class from Scalar config always exists.
 * If Unhead provides body classes, merge them rather than overriding.
 */
function mergeBodyAttrsWithInitialClass(bodyAttrs: string, initialBodyClass: 'dark-mode' | 'light-mode'): string {
  const classAttributePattern = /\sclass=(['"])(.*?)\1/i
  const classMatch = bodyAttrs.match(classAttributePattern)

  if (!classMatch) {
    return `${bodyAttrs} class="${initialBodyClass}"`
  }

  const existingClasses = classMatch[2].split(/\s+/).filter(Boolean)
  const mergedClasses = Array.from(new Set([...existingClasses, initialBodyClass])).join(' ')

  return bodyAttrs.replace(classAttributePattern, ` class="${mergedClasses}"`)
}

async function renderApiReferenceApp(options: {
  configuration: AnyApiReferenceConfiguration
  pageTitle?: string
}): Promise<{ html: string; head: RenderedSsrHead }> {
  const normalizedConfiguration = unwrapConfig(options.configuration)
  const app = createSSRApp(() => h(ApiReference, { configuration: normalizedConfiguration }))
  const head = createHeadInstance(options.pageTitle)
  app.use(head)
  app.config.idPrefix = 'scalar-refs'

  const html = await renderToString(app)
  const headTags = await renderSSRHead(head)

  return {
    html,
    head: headTags,
  }
}

/**
 * Render the Scalar API Reference to an HTML string for server-side rendering.
 * Use createApiReference on the client to hydrate the server-rendered output.
 *
 * Returns only the Vue-rendered HTML. Use generateBodyScript separately to get
 * the dark/light mode script — place it outside the app container so it does not
 * interfere with Vue hydration.
 */
export async function renderApiReferenceToString(configuration: AnyApiReferenceConfiguration): Promise<string> {
  const { html } = await renderApiReferenceApp({ configuration })
  return html
}

let _cachedCss: string | undefined
let _cachedJs: string | undefined

/** Read the built style.css from the @scalar/api-reference package. */
function getDefaultCss(): string {
  if (_cachedCss === undefined) {
    const cssPath = require.resolve('@scalar/api-reference/style.css')
    _cachedCss = readFileSync(cssPath, 'utf-8')
  }
  return _cachedCss
}

/**
 * Get the standalone JavaScript bundle as a string.
 *
 * Serve this at a route (e.g. `/scalar/scalar.js`) and pass the same path
 * as the `cdn` option to `renderApiReference`. The bundle handles client-side
 * hydration of the server-rendered HTML.
 */
export function getJsAsset(): string {
  if (_cachedJs === undefined) {
    const apiReferenceEntryPath = require.resolve('@scalar/api-reference')
    const apiReferencePackageRoot = resolve(dirname(apiReferenceEntryPath), '..')
    const apiReferencePackageJsonPath = resolve(apiReferencePackageRoot, 'package.json')
    const apiReferencePackageJson = JSON.parse(readFileSync(apiReferencePackageJsonPath, 'utf-8')) as {
      browser?: unknown
    }

    if (typeof apiReferencePackageJson.browser !== 'string' || apiReferencePackageJson.browser.length === 0) {
      throw new Error(
        `Could not resolve @scalar/api-reference browser entry from "${apiReferencePackageJsonPath}". ` +
          'Expected a string "browser" field in package.json.',
      )
    }

    const jsPath = resolve(apiReferencePackageRoot, apiReferencePackageJson.browser)

    if (!existsSync(jsPath)) {
      throw new Error(
        `Could not locate @scalar/api-reference standalone bundle at "${jsPath}". Run the package build before reading SSR assets.`,
      )
    }

    _cachedJs = readFileSync(jsPath, 'utf-8')
  }
  return _cachedJs
}

/** Escape HTML special characters in user-provided strings. */
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Escape user-provided strings before inserting into HTML attributes. */
function escapeHtmlAttribute(str: string): string {
  return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * Escape a JSON string so it is safe to embed inside an inline script tag.
 * This prevents user content from closing the script tag.
 */
function escapeJsonForInlineScript(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * Escape a function's source code so it is safe to embed inside an inline script tag.
 *
 * Unlike escapeJsonForInlineScript (which escapes all `<` and `>`), this only neutralizes
 * sequences that could break out of a `<script>` block or open an HTML comment:
 * - `</` (case-insensitive closing tags, e.g. `</script>`)
 * - `<!--` (HTML comment open)
 * - U+2028 / U+2029 (line/paragraph separators, invalid in JS source outside strings)
 *
 * This preserves JS syntax like `=>`, `<`, `>`, and `>=`.
 */
function escapeFunctionSourceForInlineScript(source: string): string {
  return source
    .replace(/<\//g, '<\\/')
    .replace(/<!--/g, '<\\!--')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** Add consistent indentation to multiline strings embedded in HTML output. */
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
 * Reject function values that would otherwise be silently dropped by JSON.stringify.
 * SSR only supports top-level function props and top-level arrays containing functions,
 * matching the client-side renderer behavior.
 */
const assertNoNestedFunctions = (value: unknown, path: string): void => {
  if (typeof value === 'function') {
    throw new Error(
      `Cannot serialize function at "${path}" for SSR hydration. ` +
        'Only top-level function properties and top-level arrays containing functions are supported.',
    )
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoNestedFunctions(item, `${path}[${index}]`))
    return
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nestedValue]) => assertNoNestedFunctions(nestedValue, `${path}.${key}`))
  }
}

const serializeJsonValue = (value: unknown): string => escapeJsonForInlineScript(JSON.stringify(value))

const serializeJsonObject = (value: Record<string, unknown>): string =>
  escapeJsonForInlineScript(JSON.stringify(value, null, 2))

const serializePropertyKey = (key: string): string => escapeJsonForInlineScript(JSON.stringify(key))

const serializeArrayWithFunctions = (value: unknown[], path: string): string => {
  return `[${value
    .map((item, index) => {
      if (typeof item === 'function') {
        return escapeFunctionSourceForInlineScript(item.toString())
      }

      assertNoNestedFunctions(item, `${path}[${index}]`)
      return serializeJsonValue(item)
    })
    .join(', ')}]`
}

const serializeFunctionProperty = (key: string, value: Function): string =>
  `${serializePropertyKey(key)}: ${escapeFunctionSourceForInlineScript(value.toString())}`

const serializeArrayProperty = (key: string, value: unknown[]): string =>
  `${serializePropertyKey(key)}: ${serializeArrayWithFunctions(value, key)}`

const mergeSerializedProperties = (jsonObjectLiteral: string, dynamicProperties: string[]): string => {
  const formattedDynamicProperties = addIndent(dynamicProperties.join(',\n'), 8, true)

  if (jsonObjectLiteral === '{}') {
    return `{\n${formattedDynamicProperties}\n      }`
  }

  const jsonWithoutClosingBrace = jsonObjectLiteral.split('\n').slice(0, -1).join('\n')
  return `${jsonWithoutClosingBrace},\n${formattedDynamicProperties}\n      }`
}

/**
 * Serialize a configuration object to a JavaScript object literal for hydration.
 * Top-level function props and top-level arrays containing functions are preserved
 * to match the client-side renderer behavior.
 */
export function serializeConfigToJs(config: Record<string, unknown>): string {
  const restConfig = { ...config }
  const dynamicProperties: string[] = []

  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === 'function') {
      dynamicProperties.push(serializeFunctionProperty(key, value))
      delete restConfig[key]
      return
    }

    if (Array.isArray(value) && value.some((item) => typeof item === 'function')) {
      dynamicProperties.push(serializeArrayProperty(key, value))
      delete restConfig[key]
      return
    }

    assertNoNestedFunctions(value, key)
  })

  const jsonString = serializeJsonObject(restConfig)
  const indentedJsonString = addIndent(jsonString, 6)

  if (dynamicProperties.length === 0) {
    return indentedJsonString
  }

  return mergeSerializedProperties(indentedJsonString, dynamicProperties)
}

/**
 * Render the Scalar API Reference as a complete HTML document with client-side
 * hydration.
 *
 * Returns a full `<!doctype html>` page with:
 * - Inline CSS in `<head>` (prevents flash of unstyled content)
 * - Color-mode detection script (runs before first paint)
 * - Pre-rendered Vue HTML (immediate content, no blank page)
 * - Script tags to load the standalone bundle and hydrate
 *
 * Serve the standalone JS bundle via `getJsAsset()` at the route matching
 * the `cdn` option (defaults to `/scalar/scalar.js`).
 */
export async function renderApiReference(options: {
  /** The API reference configuration. */
  config: AnyApiReferenceConfiguration
  /** Page title. Defaults to "Scalar API Reference". */
  pageTitle?: string
  /** Override the built-in CSS. */
  css?: string
  /** URL path to the standalone JS bundle. Defaults to "/scalar/scalar.js". */
  cdn?: string
}): Promise<string> {
  const title = options.pageTitle ?? 'Scalar API Reference'
  const css = options.css ?? getDefaultCss()
  const cdn = escapeHtmlAttribute(options.cdn ?? '/scalar/scalar.js')
  const { html, head } = await renderApiReferenceApp({
    configuration: options.config,
    pageTitle: title,
  })
  const bodyScript = generateBodyScript(options.config)
  const initialBodyClass = getInitialBodyClass(options.config)
  const bodyAttrs = mergeBodyAttrsWithInitialClass(head.bodyAttrs, initialBodyClass)
  const configJs = serializeConfigToJs(unwrapConfig(options.config))

  return `<!doctype html>
<html${head.htmlAttrs || ' lang="en"'}>
  <head>
    ${head.headTags}
    <style>${css}</style>
  </head>
  <body${bodyAttrs}>
    ${head.bodyTagsOpen}
    ${bodyScript}
    <div id="app">${html}</div>
    <script src="${cdn}"></script>
    <script>Scalar.createApiReference('#app', ${configJs})</script>
    ${head.bodyTags}
  </body>
</html>`
}
