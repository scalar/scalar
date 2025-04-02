import { z } from 'zod'

export const XScalarRedirectUriSchema = z.object({
  'x-scalar-redirect-uri': z.string().optional().catch(undefined),
})
