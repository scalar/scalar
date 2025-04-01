import { z } from 'zod'

export const XScalarRedirectUriSchema = {
  'x-scalar-redirect-uri': z.string().optional(),
}
