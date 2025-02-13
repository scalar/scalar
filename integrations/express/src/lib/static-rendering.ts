import type { ApiReferenceOptions } from '@/types'
import type { ReferenceConfiguration } from '@scalar/types'

const DEFAULT_CONFIGURATION: Partial<ReferenceConfiguration> = {
  _integration: 'express',
}

/**
 * The HTML document to render the Scalar API reference.
 */
export function getHtmlDocument(
  options: ApiReferenceOptions,
  customTheme?: string,
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Scalar API Reference</title>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1" />
        <style>
          ${options.theme ? null : (customTheme ?? '')}
        </style>
      </head>
      <body>
        ${getScriptTags(options)}
      </body>
    </html>
  `
}

/**
 * The script tags to load the @scalar/api-reference package from the CDN.
 */
export function getScriptTags(configuration: ApiReferenceOptions) {
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
export function getConfiguration(givenConfiguration: ApiReferenceOptions) {
  const configuration = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  }

  delete configuration.spec

  return JSON.stringify(configuration).split('"').join('&quot;')
}

/**
 * The content to pass to the @scalar/api-reference package as the <script> tag content.
 */
export function getScriptTagContent(configuration: ApiReferenceOptions) {
  return configuration.spec?.content
    ? typeof configuration.spec?.content === 'function'
      ? JSON.stringify(configuration.spec?.content())
      : JSON.stringify(configuration.spec?.content)
    : ''
}

/**
 * The CDN URL to load the @scalar/api-reference package from.
 */
export function getCdnUrl(configuration: ApiReferenceOptions) {
  return (
    configuration.cdn || 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
  )
}
