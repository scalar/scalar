import { z } from 'zod'

export const XInternalSchema = z.object({
  'x-internal': z.boolean().optional().catch(undefined),
})
