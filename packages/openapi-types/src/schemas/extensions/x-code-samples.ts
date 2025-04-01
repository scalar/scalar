import { z } from 'zod'

export const XCodeSamplesSchema = z.object({
  'x-codeSamples': z
    .array(
      z.object({
        lang: z.string().optional().catch(undefined),
        label: z.string().optional().catch(undefined),
        source: z.string(),
      }),
    )
    .optional(),
})
