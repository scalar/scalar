import { z } from 'zod'

import { nanoidSchema } from '../shared'

const parsed = z.object({
  key: z.string(),
  value: z.string(),
})

const environmentSchema = z.object({
  uid: nanoidSchema,
  name: z.string(),
  color: z.string(),
  raw: z.string(),
  parsed: z.array(parsed),
  isDefault: z.boolean().optional(),
})

/** Environment */
export type Environment = z.infer<typeof environmentSchema>
export type EnvironmentPayload = z.input<typeof environmentSchema>

/** Create environment helper */
export const createEnvironment = (payload: EnvironmentPayload) =>
  environmentSchema.parse(payload)
