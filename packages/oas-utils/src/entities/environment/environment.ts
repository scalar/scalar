import { z } from 'zod'

import { type ENTITY_BRANDS, nanoidSchema } from '@/entities/shared/utility'

export const EnvironmentSchema = z.object({
  uid: nanoidSchema.brand<ENTITY_BRANDS['ENVIRONMENT']>(),
  name: z.string().optional().default('Default Environment'),
  color: z.string().optional().default('#0082D0'),
  value: z.string().default(''),
  isDefault: z.boolean().optional(),
})

/** Environment */
export type Environment = z.infer<typeof EnvironmentSchema>
export type EnvironmentPayload = z.input<typeof EnvironmentSchema>
