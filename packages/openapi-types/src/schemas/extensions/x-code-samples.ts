import { z } from 'zod'

export const XCodeSampleSchema = z.object({
  lang: z.string().optional().catch(undefined),
  label: z.string().optional().catch(undefined),
  source: z.string(),
})

export const XCodeSamplesSchema = z.object({
  'x-codeSamples': XCodeSampleSchema.array().optional().catch(undefined),
  'x-code-samples': XCodeSampleSchema.array().optional().catch(undefined),
  'x-custom-examples': XCodeSampleSchema.array().optional().catch(undefined),
})

export type XCodeSample = z.infer<typeof XCodeSampleSchema>
