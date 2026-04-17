import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

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

/**
 * Render the Scalar API Reference to an HTML string for server-side rendering.
 * Use createApiReference on the client to hydrate the server-rendered output.
 *
 * Returns only the Vue-rendered HTML. Use generateBodyScript separately to get
 * the dark/light mode script — place it outside the app container so it does not
 * interfere with Vue hydration.
 */
export async function renderApiReferenceToString(configuration: AnyApiReferenceConfiguration): Promise<string> {
  const normalizedConfiguration = unwrapConfig(configuration)
  const app = createSSRApp(() => h(ApiReference, { configuration: normalizedConfiguration }))
  app.config.idPrefix = 'scalar-refs'

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
 * Serialize a configuration object to JSON for hydration.
 * Function values are intentionally stripped because they cannot be safely
 * represented in an inline script.
 */
function serializeConfigToJs(config: Record<string, unknown>): string {
  const jsonString = JSON.stringify(config, (_, value) => {
    if (typeof value === 'function') {
      return undefined
    }

    return value
  })

  return escapeJsonForInlineScript(jsonString)
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
  const cdn = escapeHtmlAttribute(options.cdn ?? '/scalar/scalar.js')
  const html = await renderApiReferenceToString(options.config)
  const bodyScript = generateBodyScript(options.config)
  const initialBodyClass = getInitialBodyClass(options.config)
  const configJs = serializeConfigToJs(unwrapConfig(options.config))

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>${css}</style>
  </head>
  <body class="${initialBodyClass}">
    ${bodyScript}
    <div id="app">${html}</div>
    <script src="${cdn}"></script>
    <script>Scalar.createApiReference('#app', ${configJs})</script>
  </body>
</html>`
}
