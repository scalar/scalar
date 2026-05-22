import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

export const XScalarSelectedServerSchema = Type.Object({
  'x-scalar-selected-server': Type.Optional(Type.String()),
})

export type XScalarSelectedServer = {
  /**
   * The currently selected server. For OpenAPI documents this is the server URL; for AsyncAPI documents this is the
   * server name (key in `document.servers`).
   */
  'x-scalar-selected-server'?: string
}

export const XScalarSelectedServer = object(
  {
    'x-scalar-selected-server': optional(
      string({
        typeComment:
          'The currently selected server. For OpenAPI documents this is the server URL; for AsyncAPI documents this is the server name (key in `document.servers`).',
      }),
    ),
  },
  {
    typeName: 'XScalarSelectedServer',
    typeComment:
      'The currently selected server. For OpenAPI documents this is the server URL; for AsyncAPI documents this is the server name (key in `document.servers`).',
  },
)
