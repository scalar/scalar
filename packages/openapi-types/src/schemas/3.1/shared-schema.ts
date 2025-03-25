import { z } from 'zod'

/**
 * Base schema for objects that can contain media type information
 * This helps break circular dependencies between media-type-object, encoding-object, and header-object
 */
export const BaseMediaContentSchema = z.record(
  z.string(),
  z.lazy(() =>
    z.object({
      schema: z.any().optional(),
      example: z.any().optional(),
      examples: z.record(z.string(), z.any()).optional(),
      encoding: z.record(z.string(), z.any()).optional(),
    }),
  ),
)
