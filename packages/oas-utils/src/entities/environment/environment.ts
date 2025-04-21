import { z } from 'zod'

import type { ENTITY_BRANDS } from '@scalar/types/utils'

export const environmentSchema = z.object({
  uid: z.string().brand<ENTITY_BRANDS['ENVIRONMENT']>(),
  name: z.string().optional().default('Default Environment'),
  color: z.string().optional().default('#FFFFFF'),
  value: z.string().default(''),
  isDefault: z.boolean().optional(),
})

/** Environment */
export type Environment = z.infer<typeof environmentSchema>
export type EnvironmentPayload = z.input<typeof environmentSchema>
