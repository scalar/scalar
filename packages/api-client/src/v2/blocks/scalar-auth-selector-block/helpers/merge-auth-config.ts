import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import type { ComponentsObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRefDeep } from '@/v2/blocks/operation-code-sample'

import { extractSecuritySchemeSecrets } from './extract-security-scheme-secrets'

/** Document security merged with the config security schemes */
export type MergedSecuritySchemes = NonNullable<ComponentsObject['securitySchemes']>

/** Merge the authentication config with the document security schemes */
export const mergeAuthConfig = ({
  documentSlug,
  authStore,
  documentSecuritySchemes = {},
  configSecuritySchemes = {},
}: {
  documentSlug: string
  authStore: AuthStore
  documentSecuritySchemes: ComponentsObject['securitySchemes']
  configSecuritySchemes: AuthenticationConfiguration['securitySchemes']
}): MergedSecuritySchemes => {
  /** We need to resolve any refs here before we merge */
  const resolvedDocumentSecuritySchemes = getResolvedRefDeep(documentSecuritySchemes)

  extractSecuritySchemeSecrets({
    documentSlug,
    authStore,
    configSecuritySchemes,
    documentSecuritySchemes: resolvedDocumentSecuritySchemes,
  })

  /** Merge the ccurity schemes into the document security schemes */
  return mergeObjects<ComponentsObject['securitySchemes']>(resolvedDocumentSecuritySchemes, configSecuritySchemes) ?? {}
}
