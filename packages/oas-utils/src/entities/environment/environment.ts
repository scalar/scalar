import { z } from 'zod'

import { nanoidSchema } from '../shared'

export const environmentSchema = z.object({
  uid: nanoidSchema.brand('environment'),
  name: z.string().optional().default('Default Environment'),
  color: z.string().optional().default('#0082D0'),
  value: z.string().default(''),
  isDefault: z.boolean().optional(),
})

/** Environment */
export type Environment = z.infer<typeof environmentSchema>
export type EnvironmentPayload = z.input<typeof environmentSchema>
