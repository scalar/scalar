import { Type } from '@scalar/typebox'

import { SecurityRequirementObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'

/**
 * Selected security schemes and the currently selected tab
 */
export const XScalarSelectedSecuritySchema = Type.Object({
  'x-scalar-selected-security': Type.Optional(
    Type.Object({
      'x-selected-index': Type.Integer(),
      'x-schemes': Type.Array(SecurityRequirementObjectRef),
    }),
  ),
})

export type XScalarSelectedSecurity = {
  'x-scalar-selected-security'?: {
    'x-selected-index': number
    'x-schemes': SecurityRequirementObject[]
  }
}
