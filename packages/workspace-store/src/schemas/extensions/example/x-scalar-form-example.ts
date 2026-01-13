import { Type } from '@scalar/typebox'

export const XScalarFormExample = Type.Object({
  'x-scalar-form-example': Type.Array(
    Type.Object({
      name: Type.String(),
      value: Type.Union([
        Type.String(),
        Type.Unsafe<File>({
          type: 'object',
          instanceOf: 'File',
        }),
      ]),
      'x-disabled': Type.Boolean(),
    }),
  ),
})

/**
 * OpenAPI extension to specify that the example value is stored in our formData array
 *
 * This is required because we handle formData as an array but its an object in the schema,
 * if we store it as just an object example value we don't have access to `isDisabled`
 */
export type XScalarFormExample = {
  'x-scalar-form-example': {
    name: string
    value: string | File
    'x-disabled': boolean
  }[]
}
