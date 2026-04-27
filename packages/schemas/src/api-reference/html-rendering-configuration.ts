import { object, string } from '@scalar/validation'

export const htmlRenderingConfigurationSchema = object({
  /**
   * The URL to the Scalar API Reference JS CDN.
   *
   * Use this to pin a specific version of the Scalar API Reference.
   *
   * @default https://cdn.jsdelivr.net/npm/@scalar/api-reference
   *
   * @example https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.122
   */
  cdn: string({
    default: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
  }),
  pageTitle: string({
    default: 'Scalar API Reference',
  }),
})
