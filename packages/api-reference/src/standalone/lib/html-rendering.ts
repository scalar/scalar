import { apiReferenceConfigurationSchema, type ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { z } from 'zod'

/**
 * Zod schema for HTML rendering configuration
 */
export const htmlRenderingOptionsSchema = z.object({
  /**
   * The URL to the Scalar API Reference JS CDN.
   *
   * Use this to pin a specific version of the Scalar API Reference.
   *
   * @default https://cdn.jsdelivr.net/npm/@scalar/api-reference
   *
   * @example https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.122
   */
  cdn: z.string().optional().default('https://cdn.jsdelivr.net/npm/@scalar/api-reference'),
  /**
   * The title of the page.
   */
  pageTitle: z.string().optional().default('Scalar API Reference'),
})
type HtmlRenderingOptions = z.infer<typeof htmlRenderingOptionsSchema>

export type HtmlRenderingConfiguration = ApiReferenceConfiguration & HtmlRenderingOptions

/**
 * The HTML document to render the Scalar API reference.
 *
 * We must check the passed in configuration and not the parsedConfig for the theme as the parsedConfig will have it
 * defaulted to 'default'
 */
export const getHtmlDocument = (configuration: Partial<HtmlRenderingConfiguration>, customTheme = '') => {
  const { cdn, pageTitle, ...rest } = configuration
  const parsedHtmlOptions = htmlRenderingOptionsSchema.parse({ cdn, pageTitle, customTheme })
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
