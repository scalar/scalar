// TODO: Oh, do we really want to make this a dependency?
// import type { Component } from 'vue'

import { z } from 'zod'

export const OpenApiExtensionSchema = z.object({
  /**
   * Name of specification extension property. Has to start with `x-`.
   *
   * @example
   * ```yaml
   * x-custom-extension: foobar
   * ```
   */
  name: z.string().regex(/^x-/),
  /**
   * Vue component to render the specification extension
   */
  component: z.unknown(),
  /**
   * Custom renderer to render the specification extension
   */
  renderer: z.unknown().optional(),
})

export const ApiReferencePluginSchema = z.function().returns(
  z.object({
    name: z.string(),
    extensions: z.array(OpenApiExtensionSchema),
  }),
)

// Infer the types from the schemas
export type SpecificationExtension = z.infer<typeof OpenApiExtensionSchema>
export type ApiReferencePlugin = z.infer<typeof ApiReferencePluginSchema>
