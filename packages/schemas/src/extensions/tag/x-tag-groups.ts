import { array, intersection, object, optional, string } from '@scalar/validation'

import { XScalarOrder as XScalarOrderFields } from '../general/x-scalar-order'

export const XTagGroup = intersection(
  [
    object(
      {
        name: string({ typeComment: 'The group name.' }),
        tags: array(string(), { typeComment: 'List of tags to include in this group.' }),
      },
      {
        typeName: 'XTagGroupBase',
      },
    ),
    XScalarOrderFields,
  ],
  {
    typeName: 'XTagGroup',
    typeComment: 'A tag group with optional custom ordering',
  },
)

/**
 * x-tagGroups
 *
 * List of tags to include in this group.
 */
export const XTagGroups = object(
  {
    'x-tagGroups': optional(
      array(XTagGroup, {
        typeComment: 'Tag groups for organizing tags in the UI',
      }),
    ),
  },
  {
    typeName: 'XTagGroups',
    typeComment:
      'Groups of tags for organizing the sidebar in the Scalar UI.\n\n@example\n```yaml\nx-tagGroups:\n  - name: Core API\n    tags: [users, auth]\n```',
  },
)
