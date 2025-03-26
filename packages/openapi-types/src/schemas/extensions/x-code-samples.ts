import { z } from 'zod'

export const XCodeSamplesSchema = z.object({
  'x-codeSamples': z
    .array(
      z.object({
        lang: z.string().optional(),
        label: z.string().optional(),
        source: z.string(),
      }),
    )
    .optional(),
})
