import { object, optional, string, unknown } from '@scalar/validation'

/**
 * Reusable Object.
 *
 * References an object contained within the Components Object, using a Runtime Expression (for
 * example `$components.parameters.page`). Cannot be extended with specification extensions —
 * any additional properties on a Reusable Object MUST be ignored.
 */
export const arazzoReusableObject = object(
  {
    reference: string({ typeComment: 'REQUIRED. A Runtime Expression used to reference the desired object.' }),
    value: optional(
      unknown({
        typeComment: 'Sets a value of the referenced parameter. Only applicable for parameter object references.',
      }),
    ),
  },
  { typeName: 'ArazzoReusableObject' },
)
