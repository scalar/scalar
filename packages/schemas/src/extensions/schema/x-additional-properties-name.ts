import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * x-additionalPropertiesName
 *
 * Custom attribute name for additionalProperties in a schema.
 * This allows specifying a descriptive name for additional properties that may be present in an object.
 */
export const XAdditionalPropertiesName = object(
  {
    'x-additionalPropertiesName': optional(
      string({
        typeComment: 'Human-readable label for additional properties on this schema',
      }),
    ),
  },
  {
    typeName: 'XAdditionalPropertiesName',
    typeComment: typeCommentWithExample('Display name for additional properties on a schema object.', {
      language: 'yaml',
      body: 'x-additionalPropertiesName: metadata',
    }),
  },
)
