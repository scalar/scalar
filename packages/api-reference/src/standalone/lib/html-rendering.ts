import type { ReferenceConfiguration } from '@/types'

/**
 * The CDN configuration for the Scalar API Reference.
 */
export type CdnConfiguration = {
  /**
   * The URL to the Scalar API Reference JS CDN.
   *
   * Use this to pin a specific version of the Scalar API Reference.
   *
   * @default https://cdn.jsdelivr.net/npm/@scalar/api-reference
   *
   * @example https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.122
   */
  cdn?: string
}

/**
 * The page title configuration for the Scalar API Reference.
 */
export type PageTitleConfiguration = {
  /**
   * The title of the page.
   */
  pageTitle?: string
}

export type HtmlRenderingConfiguration = ReferenceConfiguration & CdnConfiguration & PageTitleConfiguration

/**
 * The HTML document to render the Scalar API reference.
 */
export function getHtmlDocument(configuration: HtmlRenderingConfiguration, customTheme?: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${getPageTitle(configuration)}</title>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1" />
        <style>
          ${configuration.theme ? null : (customTheme ?? '')}
        </style>
      </head>
      <body>
        ${getScriptTags(configuration)}
      </body>
    </html>
  `
}

/**
 * The script tags to load the @scalar/api-reference package from the CDN.
 */
export function getScriptTags(configuration: HtmlRenderingConfiguration) {
  return `
      <script
        id="api-reference"
        type="application/json"
        data-configuration="${getConfiguration(configuration)}">${getScriptTagContent(configuration)}</script>
        <script src="${getCdnUrl(configuration)}"></script>
    `
}

/**
 * The configuration to pass to the @scalar/api-reference package.
 */
export function getConfiguration(givenConfiguration: HtmlRenderingConfiguration) {
  // Clone before mutating
  const configuration = {
    ...givenConfiguration,
  }

  if (!configuration.spec?.url) {
    delete configuration.spec
  } else if (configuration.spec?.content) {
    delete configuration.spec?.content
  }

  return JSON.stringify(configuration).split('"').join('&quot;')
}

/**
 * The content to pass to the @scalar/api-reference package as the <script> tag content.
 */
export function getScriptTagContent(configuration: HtmlRenderingConfiguration) {
  return configuration.spec?.content
    ? typeof configuration.spec?.content === 'function'
      ? JSON.stringify(configuration.spec?.content())
      : JSON.stringify(configuration.spec?.content)
    : ''
}

/**
 * The CDN URL to load the @scalar/api-reference package from.
 */
export function getCdnUrl(configuration: HtmlRenderingConfiguration) {
  return configuration.cdn || 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
}

/**
 * The page title for the Scalar API Reference.
 */
export function getPageTitle(configuration: HtmlRenderingConfiguration) {
  return configuration.pageTitle || 'Scalar API Reference'
}
