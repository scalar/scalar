import {
  type ApiReferenceConfiguration,
  type HtmlRenderingConfiguration,
  apiReferenceConfigurationSchema,
  htmlRenderingConfigurationSchema,
} from '@scalar/types/api-reference'

// Re-export the type for convenience
export type { HtmlRenderingConfiguration }

/**
 * The HTML document to render the Scalar API reference.
 *
 * We must check the passed in configuration and not the parsedConfig for the theme as the parsedConfig will have it
 * defaulted to 'default'
 */
export const getHtmlDocument = (configuration: Partial<HtmlRenderingConfiguration>, customTheme = '') => {
  const { cdn, pageTitle, ...rest } = configuration

  const parsedHtmlOptions = htmlRenderingConfigurationSchema.parse({ cdn, pageTitle, customTheme })
  const parsedConfig = apiReferenceConfigurationSchema.parse(rest)

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${parsedHtmlOptions.pageTitle}</title>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1" />
        <style>
          ${configuration.theme ? '' : customTheme}
        </style>
      </head>
      <body>
        ${getScriptTags(parsedConfig, parsedHtmlOptions.cdn)}
      </body>
    </html>
  `
}

/**
 * The script tags to load the @scalar/api-reference package from the CDN.
 */
export function getScriptTags(configuration: ApiReferenceConfiguration, cdn: string) {
  return `
      <script
        id="api-reference"
        type="application/json"
        data-configuration="${getConfiguration(configuration)}">${getScriptTagContent(configuration)}</script>
        <script src="${cdn}"></script>
    `
}

/**
 * The configuration to pass to the @scalar/api-reference package.
 */
export const getConfiguration = (givenConfiguration: ApiReferenceConfiguration) => {
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
export const getScriptTagContent = (configuration: ApiReferenceConfiguration) =>
  configuration.spec?.content
    ? typeof configuration.spec?.content === 'function'
      ? JSON.stringify(configuration.spec?.content())
      : JSON.stringify(configuration.spec?.content)
    : ''
