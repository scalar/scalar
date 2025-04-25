import { z } from 'zod'

const SectionViewSchema = z.object({
  title: z.string().optional(),
  // Since this is meant to be a Vue component, we'll use unknown
  component: z.unknown(),
  props: z.record(z.any()).optional(),
})

const ViewsSchema = z.object({
  'request.section': z.array(SectionViewSchema),
  'response.section': z.array(SectionViewSchema),
})

const HooksSchema = z.object({
  onBeforeRequest: z.function().returns(z.union([z.void(), z.promise(z.void())])),
  onResponseReceived: z
    .function()
    .args(
      z.object({
        response: z.instanceof(Response),
        // Ideally, we'd have the Operation type here, but we don't.
        operation: z.record(z.any()),
      }),
    )
    .returns(z.union([z.void(), z.promise(z.void())])),
})

export const ApiClientPluginSchema = z.function().returns(
  z.object({
    name: z.string(),
    views: ViewsSchema,
    hooks: HooksSchema,
  }),
)

export type ApiClientPlugin = z.infer<typeof ApiClientPluginSchema>
