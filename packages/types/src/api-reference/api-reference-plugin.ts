// TODO: Oh, do we really want to make this a dependency?
// import type { Component } from 'vue'

import { z } from 'zod'

export const OpenApiExtensionSchema = z.object({
  /**
   * Name of custom OpenAPI extension property. Has to start with `x-`.
   *
   * @example
   * ```yaml
   * x-custom-extension: foobar
   * ```
   */
  name: z.string().regex(/^x-/),
  /**
   * Vue component to render the OpenAPI extension
   */
  component: z.unknown(),
})

export const ApiReferencePluginSchema = z.function().returns(
  z.object({
    name: z.string(),
    extensions: z.array(OpenApiExtensionSchema),
  }),
)

// Infer the types from the schemas
export type OpenApiExtension = z.infer<typeof OpenApiExtensionSchema>
export type ApiReferencePlugin = z.infer<typeof ApiReferencePluginSchema>
