import { array, object, optional, record, string, union } from '@scalar/validation'

const enumDescriptionValue = union([record(string(), string()), array(string())])

/**
 * x-enumDescriptions / x-enum-descriptions
 *
 * Maps enum values to their descriptions. Each key should correspond to an enum value,
 * and the value is the description for that enum value.
 *
 * @example
 * ```yaml
 * x-enumDescriptions:
 *   missing_features: Missing features
 *   too_expensive: Too expensive
 *   unused: Unused
 *   other: Other
 * ```
 */
export const XEnumDescriptions = object(
  {
    'x-enumDescriptions': optional(enumDescriptionValue, {
      typeComment: 'Map or list of descriptions keyed by enum value (camelCase spelling)',
    }),
    'x-enum-descriptions': optional(enumDescriptionValue, {
      typeComment: 'Map or list of descriptions keyed by enum value (kebab-case spelling)',
    }),
  },
  {
    typeName: 'XEnumDescriptions',
    typeComment:
      'Descriptions for enum values. Keys must match enum values.\n\n@example\n```yaml\nx-enumDescriptions:\n  other: Other reason\n```',
  },
)
