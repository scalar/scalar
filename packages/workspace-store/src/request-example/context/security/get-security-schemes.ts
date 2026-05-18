import type { SecurityRequirementObject } from '@scalar/types/openapi/3.1'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import type { MergedSecuritySchemes } from '@/request-example/context/security/merge-security'

/**
 * Get the selected security schemes from security requirements.
 * Takes security requirement objects and resolves them to actual security scheme objects.
 */
export const getSecuritySchemes = (
  securitySchemes: MergedSecuritySchemes,
  selectedSecurity: SecurityRequirementObject,
): SecuritySchemeObjectSecret[] =>
  Object.keys(selectedSecurity).flatMap((key) => {
    const scheme = getResolvedRef(securitySchemes?.[key])
    if (scheme) {
      return scheme
    }

    return []
  })
