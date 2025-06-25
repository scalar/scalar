import { z } from 'zod'
import type { ApiReferenceConfigurationWithSources } from './api-reference-configuration'

/**
 * Zod schema for HTML rendering configuration
 */
export const htmlRenderingConfigurationSchema = z.object({
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

/**
 * The configuration for the static HTML rendering using the CDN.
 *
 * It's the ApiReferenceConfiguration, but extended with the `pageTitle` and `cdn` options.
 */
export type HtmlRenderingConfiguration = Partial<ApiReferenceConfigurationWithSources> &
  z.infer<typeof htmlRenderingConfigurationSchema>
