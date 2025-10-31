import { type Static, Type } from '@scalar/typebox'

import { SecurityRequirementObjectRef } from '@/schemas/v3.1/strict/ref-definitions'

/**
 * A scalar secret token
 *
 * We should not export this when exporting the document
 */
export const XScalarSelectedSecuritySchema = Type.Object({
  'x-scalar-selected-security': Type.Optional(
    Type.Object({
      'x-selected-index': Type.Integer(),
      'x-schemes': Type.Array(SecurityRequirementObjectRef),
    }),
  ),
})

export type XScalarSelectedSecurity = Static<typeof XScalarSelectedSecuritySchema>
