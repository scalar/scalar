import { z } from 'zod'

export const xScalarChildrenSchema = z
  .object({
    tagName: z.string(),
  })
  .array()
