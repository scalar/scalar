import { Type } from '@scalar/typebox'

import { SecurityRequirementObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'

export const XScalarSelectedSecuritySchema = Type.Object({
  'x-scalar-selected-security': Type.Optional(
    Type.Object({
      selectedIndex: Type.Integer(),
      selectedSchemes: Type.Array(SecurityRequirementObjectRef),
    }),
  ),
})

export type XScalarSelectedSecurity = {
  /**
   * Selected security schemes and the currently selected tab
   */
  'x-scalar-selected-security'?: {
    selectedIndex: number
    selectedSchemes: SecurityRequirementObject[]
  }
}
