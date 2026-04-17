import { objectKeys } from '@scalar/helpers/object/object-keys'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import type { MergedSecuritySchemes } from '@/request-example/context/security/merge-security'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'

/**
 * Get the selected security schemes from security requirements.
 * Takes security requirement objects and resolves them to actual security scheme objects.
 */
export const getSecuritySchemes = (
  securitySchemes: MergedSecuritySchemes,
  selectedSecurity: SecurityRequirementObject,
): SecuritySchemeObjectSecret[] =>
    objectKeys(selectedSecurity).flatMap((key) => {
      const scheme = getResolvedRef(securitySchemes?.[key])
      if (scheme) {
        return scheme
      }

      return []
    })
