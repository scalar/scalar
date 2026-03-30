import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { ApiReference } from '@scalar/api-reference'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
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
  const forced = (config.forceDarkModeState as string | undefined) ?? null
  const darkMode = (config.darkMode as boolean | undefined) ?? null

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
 * Render the Scalar API Reference to an HTML string for server-side rendering.
 * Use createApiReference on the client to hydrate the server-rendered output.
 *
 * Returns only the Vue-rendered HTML. Use generateBodyScript separately to get
 * the dark/light mode script — place it outside the app container so it does not
 * interfere with Vue hydration.
 */
export async function renderApiReferenceToString(configuration: AnyApiReferenceConfiguration): Promise<string> {
  const app = createSSRApp(() => h(ApiReference, { configuration }))

  return await renderToString(app)
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
    const jsPath = require.resolve('@scalar/api-reference/browser/standalone.js')
    _cachedJs = readFileSync(jsPath, 'utf-8')
  }
  return _cachedJs
}

/** Escape HTML special characters in user-provided strings. */
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Serialize an array that may contain functions. */
function serializeArrayWithFunctions(arr: unknown[]): string {
  return `[${arr.map((item) => (typeof item === 'function' ? item.toString() : JSON.stringify(item))).join(', ')}]`
}

/**
 * Serialize a configuration object to a JavaScript expression string,
 * preserving function values (which JSON.stringify would silently drop).
 */
function serializeConfigToJs(config: Record<string, unknown>): string {
  const jsonProps: Record<string, unknown> = {}
  const functionProps: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'function') {
      functionProps.push(`"${key}": ${value.toString()}`)
    } else if (Array.isArray(value) && value.some((item) => typeof item === 'function')) {
      functionProps.push(`"${key}": ${serializeArrayWithFunctions(value)}`)
    } else {
      jsonProps[key] = value
    }
  }

  const jsonString = JSON.stringify(jsonProps)

  if (functionProps.length === 0) {
    return jsonString
  }

  if (jsonString === '{}') {
    return `{${functionProps.join(', ')}}`
  }

  // Merge: remove trailing } from JSON, append function props
  return `${jsonString.slice(0, -1)}, ${functionProps.join(', ')}}`
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
  const title = escapeHtml(options.pageTitle ?? 'Scalar API Reference')
  const css = options.css ?? getDefaultCss()
  const cdn = options.cdn ?? '/scalar/scalar.js'
  const html = await renderApiReferenceToString(options.config)
  const bodyScript = generateBodyScript(options.config)
  const configJs = serializeConfigToJs(unwrapConfig(options.config))

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>${css}</style>
  </head>
  <body>
    ${bodyScript}
    <div id="app">${html}</div>
    <script src="${cdn}"></script>
    <script>Scalar.createApiReference('#app', ${configJs})</script>
  </body>
</html>`
}
