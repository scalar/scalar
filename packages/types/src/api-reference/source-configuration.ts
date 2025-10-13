import z from 'zod'

/**
 * A source is any potential document input used for API Reference
 * and API Client integrations. Sources may be specified in the configuration
 * or used independently. Some configurations may have multiple sources.
 */
export const sourceConfigurationSchema = z.object({
  /**
   * URL to an OpenAPI/Swagger document
   * @example
   * ```ts
   * const oldConfiguration = {
   *   spec: {
   *     url: 'https://example.com/openapi.json',
   *   },
   * }
   *
   * const newConfiguration = {
   *   url: 'https://example.com/openapi.json',
   * }
   * ```
   **/
  url: z.string().optional(),
  /**
   * Directly embed the OpenAPI document.
   * Can be a string, object, function returning an object, or null.
   *
   * @remarks It's recommended to pass a URL instead of content.
   * @example
   * ```ts
   * const oldConfiguration = {
   *   spec: {
   *     content: '…',
   *   },
   * }
   *
   * const newConfiguration = {
   *   content: '…',
   * }
   * ```
   **/
  content: z
    .union([
      z.string(),
      z.null(),
      z.record(z.string(), z.any()),
      z.function({
        input: [],
        output: z.record(z.string(), z.any()),
      }),
    ])
    .optional(),
  /**
   * The title of the OpenAPI document.
   *
   * @example 'Scalar Galaxy'
   *
   * @deprecated Please move `title` to the top level and remove the `spec` prefix.
   */
  title: z.string().optional(),
  /**
   * The slug of the OpenAPI document used in the URL.
   *
   * If none is passed, the title will be used.
   *
   * If no title is used, it'll just use the index.
   *
   * @example 'scalar-galaxy'
   *
   * @deprecated Please move `slug` to the top level and remove the `spec` prefix.
   */
  slug: z.string().optional(),
  /**
   * The OpenAPI/Swagger document to render
   *
   * @deprecated Use `url` and `content` on the top level instead.
   **/
  spec: z
    .object({
      url: z.string().optional(),
      content: z
        .union([
          z.string(),
          z.null(),
          z.record(z.string(), z.any()),
          z.function({
            input: [],
            output: z.record(z.string(), z.any()),
          }),
        ])
        .optional(),
    })
    .optional(),
})

export type SourceConfiguration = z.infer<typeof sourceConfigurationSchema>
