import { z } from 'zod'

export const XScalarIconSchema = z.object({
  'x-scalar-icon': z.string().optional().catch(undefined),
})
