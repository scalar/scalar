import type { ApiReferenceConfigurationWithMultipleSources } from './types'

/**
 * The configuration for the static HTML rendering using the CDN.
 *
 * It's the ApiReferenceConfiguration, but extended with the `pageTitle` and `cdn` options.
 */
export type HtmlRenderingConfiguration = Partial<ApiReferenceConfigurationWithMultipleSources> & {
  pageTitle: string
  cdn: string
}
