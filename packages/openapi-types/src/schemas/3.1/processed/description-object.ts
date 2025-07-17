import { z } from 'zod'

export const DescriptionSchema = z.object({
  /**
   * A description for security scheme. CommonMark syntax MAY be used for rich text representation.
   */
  description: z.string().optional(),
})
