import { z } from 'zod'

// TODO: Implement
export const LinkObjectSchema = z.object({
  operationRef: z.string(),
  operationId: z.string(),
  parameters: z.record(z.string(), z.any()),
})
