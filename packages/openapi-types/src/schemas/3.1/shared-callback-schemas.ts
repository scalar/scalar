import { z } from 'zod'

/**
 * Base Callback Object Schema
 *
 * This is a base schema for callback objects to break circular dependencies.
 * It contains the core structure without the circular references.
 */
export const BaseCallbackObjectSchema = z.record(
  z.string(),
  z.lazy(() => z.any()),
)

export type BaseCallbackObject = z.infer<typeof BaseCallbackObjectSchema>
