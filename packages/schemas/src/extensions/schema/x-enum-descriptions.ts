import { array, object, optional, record, string, union } from '@scalar/validation'

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
const enumDescriptionValue = union([record(string(), string()), array(string())])

export const XEnumDescriptions = object(
  {
    'x-enumDescriptions': optional(enumDescriptionValue),
    'x-enum-descriptions': optional(enumDescriptionValue),
  },
  {
    typeName: 'XEnumDescriptions',
    typeComment: 'Descriptions for enum values',
  },
)
