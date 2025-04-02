import { z } from 'zod'

export const XScalarIgnoreSchema = z.object({
  'x-scalar-ignore': z.boolean().optional().catch(undefined),
})
