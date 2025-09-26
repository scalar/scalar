import { z } from 'zod'

const SectionViewSchema = z.object({
  title: z.string().optional(),
  // Since this is meant to be a Vue component, we'll use unknown
  component: z.unknown(),
  props: z.record(z.string(), z.any()).optional(),
})

const ViewsSchema = z.object({
  'request.section': z.array(SectionViewSchema).optional(),
  'response.section': z.array(SectionViewSchema).optional(),
})

export const HooksSchema = z.object({
  onBeforeRequest: z
    .function({
      input: [z.object({ request: z.instanceof(Request) })],
      output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional(),
  onResponseReceived: z
    .function({
      input: [z.object({ response: z.instanceof(Response), operation: z.record(z.string(), z.any()) })],
      output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional(),
})

export const ApiClientPluginSchema = z.function({
  input: [z.void()],
  output: z.object({
    name: z.string(),
    views: ViewsSchema.optional(),
    hooks: HooksSchema.optional(),
  }),
})

export type ApiClientPlugin = z.infer<typeof ApiClientPluginSchema>
