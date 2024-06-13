import { deepMerge } from '@/helpers'
import { z } from 'zod'

import { nanoidSchema } from '../shared'

const parsed = z.object({
  key: z.string(),
  value: z.string(),
})

const environmentSchema = z.object({
  uid: nanoidSchema,
  name: z.string().optional().default('Default Environment'),
  color: z.string().optional().default('blue'),
  raw: z
    .string()
    .optional()
    .default(JSON.stringify({ exampleKey: 'exampleValue' }, null, 2)),
  parsed: z.array(parsed).optional().default([]),
  isDefault: z.boolean().optional(),
})

/** Environment */
export type Environment = z.infer<typeof environmentSchema>
export type EnvironmentPayload = z.input<typeof environmentSchema>

/** Create environment helper */
export const createEnvironment = (payload: EnvironmentPayload) =>
  deepMerge(environmentSchema.parse({}), payload)
