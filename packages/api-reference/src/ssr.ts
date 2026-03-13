import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { default as ApiReference } from '@/components/ApiReference.vue'

type SsrResult = {
  /** The rendered component HTML */
  html: string
  /** Default body class for dark/light mode (e.g. 'light-mode' or 'dark-mode') */
  bodyClass: string
  /** Inline script that detects user preference and applies the correct class before paint */
  bodyScript: string
}

/**
 * Unwrap the configuration from an array if needed, since AnyApiReferenceConfiguration
 * can be a single config or an array of configs.
 */
function unwrapConfig(configuration: AnyApiReferenceConfiguration): Record<string, unknown> {
  const config = Array.isArray(configuration) ? configuration[0] : configuration
  return (config ?? {}) as Record<string, unknown>
}

/**
 * Resolve the body class for SSR based on the configuration.
 *
 * Priority:
 * 1. forceDarkModeState → always wins
 * 2. darkMode config → explicit default
 * 3. Fallback → 'light-mode'
 */
export function resolveBodyClass(configuration: AnyApiReferenceConfiguration): string {
  const config = unwrapConfig(configuration)

  if (config.forceDarkModeState === 'dark') return 'dark-mode'
  if (config.forceDarkModeState === 'light') return 'light-mode'
  if (config.darkMode === true) return 'dark-mode'

  return 'light-mode'
}

/**
 * Generate an inline script that detects the user's color mode preference
 * and applies the correct class to <body> before content paints.
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
 * Returns the rendered HTML along with body class and inline script for
 * flash-free dark/light mode support.
 */
export async function renderApiReferenceToString(configuration: AnyApiReferenceConfiguration): Promise<SsrResult> {
  const app = createSSRApp(() => h(ApiReference, { configuration }))

  const html = await renderToString(app)
  const bodyClass = resolveBodyClass(configuration)
  const bodyScript = generateBodyScript(configuration)

  return { html, bodyClass, bodyScript }
}
