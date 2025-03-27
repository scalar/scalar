import { z } from 'zod'

/**
 * A simple object to allow referencing other components in the OpenAPI document, internally and externally.
 */
export const ReferenceObjectSchema = z.object({
  /**
   * REQUIRED. The reference identifier. This can be a JSON Reference URI, or a JSON Pointer.
   */
  $ref: z.string(),

  /**
   * A short summary which by default SHOULD override that of the referenced component.
   */
  summary: z.string().optional(),

  /**
   * A description which by default SHOULD override that of the referenced component.
   */
  description: z.string().optional(),
})

export type ReferenceObject = z.infer<typeof ReferenceObjectSchema>
