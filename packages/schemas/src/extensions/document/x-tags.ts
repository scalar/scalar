import { array, object, optional, string } from '@scalar/validation'

export const XTags = object(
  {
    'x-tags': optional(
      array(string(), {
        typeComment: 'Ordered list of tag names for this schema object',
      }),
    ),
  },
  {
    typeName: 'XTags',
    typeComment:
      'Custom tag ordering hints for schema objects in the sidebar.\n\n@example\n```yaml\nx-tags:\n  - users\n  - admin\n```',
  },
)
