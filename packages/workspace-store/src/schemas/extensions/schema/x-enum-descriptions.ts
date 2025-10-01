import { Type } from '@scalar/typebox'

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
export const XEnumDescriptionsSchema = Type.Object({
  'x-enumDescriptions': Type.Optional(
    Type.Union([Type.Record(Type.String(), Type.String()), Type.Array(Type.String())]),
  ),
  'x-enum-descriptions': Type.Optional(
    Type.Union([Type.Record(Type.String(), Type.String()), Type.Array(Type.String())]),
  ),
})

export type XEnumDescriptions = {
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
  'x-enumDescriptions'?: Record<string, string> | string[]
  /**
   * x-enum-descriptions
   *
   * Maps enum values to their descriptions. Each key should correspond to
   * an enum value, and the value is the description for that enum value.
   *
   * Example:
   * x-enum-descriptions:
   *   missing_features: "Missing features"
   *   too_expensive: "Too expensive"
   *   unused: "Unused"
   *   other: "Other"
   */
  'x-enum-descriptions'?: Record<string, string> | string[]
}
