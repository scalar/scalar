import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { AuthenticationState, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/types/legacy'

/** Upgrade the authentication config from the old to version 2 */
export const transformAuth = (
  auth: AuthenticationState,
  securitySchemes:
    | OpenAPIV2.SecurityDefinitionsObject
    | OpenAPIV3.ComponentsObject['securitySchemes']
    | OpenAPIV3_1.ComponentsObject['securitySchemes'],
): AuthenticationConfiguration => {}
