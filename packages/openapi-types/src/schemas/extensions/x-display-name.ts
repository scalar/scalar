import { z } from 'zod'

/**
 * An OpenAPI extension to overwrite tag names with a display-friendly version
 *
 * @example
 * ```yaml
 * x-displayName: planets
 * ```
 */
export const XDisplayNameSchema = z.object({
  'x-displayName': z.string().optional().catch(undefined),
})
