import { z } from 'zod'

// TODO: Implement after https://github.com/scalar/scalar/pull/5230 is merged
// export const SecuritySchemeObjectSchema = z.object({
//   type: z.string(),
//   description: z.string().optional(),
// })

export const SecuritySchemeObjectSchema = z.record(z.string(), z.any())
