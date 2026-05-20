import { object, optional, string } from '@scalar/validation'

/**
 * An OpenAPI extension to overwrite tag names with a display-friendly version.
 *
 * @example
 * ```yaml
 * x-displayName: planets
 * ```
 */
export const XDisplayName = object(
  {
    'x-displayName': optional(
      string({
        typeComment: 'Display-friendly name shown in the UI instead of the tag name',
      }),
    ),
  },
  {
    typeName: 'XDisplayName',
    typeComment: 'Display-friendly name for a tag.\n\n@example\n```yaml\nx-displayName: planets\n```',
  },
)
