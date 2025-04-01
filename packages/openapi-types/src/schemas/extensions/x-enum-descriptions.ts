import { z } from 'zod'

/**
 * x-enumDescriptions
 *
 * Maps enum values to their descriptions. Each key should correspond to
 * an enum value, and the value is the description for that enum value.
 *
 * Example:
 * x-enumDescriptions:
 *   missing_features: "Missing features"
 *   too_expensive: "Too expensive"
 *   unused: "Unused"
 *   other: "Other"
 */
export const XEnumDescriptionsSchema = z.object({
  'x-enumDescriptions': z.record(z.string(), z.string()).catch({}),
})
