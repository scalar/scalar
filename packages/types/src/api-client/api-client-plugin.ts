import { z } from 'zod'

const SectionViewSchema = z.object({
  title: z.string().optional(),
  // Since this is meant to be a Vue component, we'll use unknown
  component: z.unknown(),
  props: z.record(z.any()).optional(),
})

const ViewsSchema = z.object({
  'request.section': z.array(SectionViewSchema).optional(),
  'response.section': z.array(SectionViewSchema).optional(),
})

export const HooksSchema = z.object({
  onBeforeRequest: z
    .function()
    .args(z.object({ request: z.instanceof(Request) }))
    .returns(z.union([z.void(), z.promise(z.void())]))
    .optional(),
  onResponseReceived: z
    .function()
    .args(
      z.object({
        response: z.instanceof(Response),
        // Ideally, we'd have the Operation type here, but we don't.
        operation: z.record(z.any()),
      }),
    )
    .returns(z.union([z.void(), z.promise(z.void())]))
    .optional(),
})

export const ApiClientPluginSchema = z.function().returns(
  z.object({
    name: z.string(),
    views: ViewsSchema.optional(),
    hooks: HooksSchema.optional(),
  }),
)

export type ApiClientPlugin = z.infer<typeof ApiClientPluginSchema>
