import { z } from 'zod'

// TODO: Implement
// export const SecuritySchemeObjectSchema = z.object({
//   type: z.string(),
//   description: z.string().optional(),
// })

export const SecuritySchemeObjectSchema = z.record(z.string(), z.any())
