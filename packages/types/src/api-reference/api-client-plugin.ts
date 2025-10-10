import { z } from 'zod'

const sectionViewSchema = z.object({
  title: z.string().optional(),
  // Since this is meant to be a Vue component, we'll use unknown
  component: z.unknown(),
  props: z.record(z.string(), z.any()).optional(),
})

const viewsSchema = z.object({
  'request.section': z.array(sectionViewSchema).optional(),
  'response.section': z.array(sectionViewSchema).optional(),
})

export const hooksSchema = z.object({
  onBeforeRequest: z
    .function({
      input: [z.object({ request: z.instanceof(Request) })],
      // Why no output? https://github.com/scalar/scalar/pull/7047
      // output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional(),
  onResponseReceived: z
    .function({
      input: [z.object({ response: z.instanceof(Response), operation: z.record(z.string(), z.any()) })],
      // Why no output? https://github.com/scalar/scalar/pull/7047
      // output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional(),
})

/**
 * An API client plugin that can connect into request and response hooks
 */
export const apiClientPluginSchema = z.function({
  input: [],
  output: z.object({
    name: z.string(),
    views: viewsSchema.optional(),
    hooks: hooksSchema.optional(),
  }),
})

export type ApiClientPlugin = z.infer<typeof apiClientPluginSchema>
