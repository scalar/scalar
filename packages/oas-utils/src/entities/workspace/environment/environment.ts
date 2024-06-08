import { z } from 'zod'

import { nanoidSchema } from '../shared'

const parsed = z.object({
  key: z.string(),
  value: z.string(),
})

export type Environment = z.infer<typeof environment>
const environment = z.object({
  uid: nanoidSchema,
  name: z.string(),
  color: z.string(),
  raw: z.string(),
  parsed: z.array(parsed),
  isDefault: z.boolean().optional(),
})
