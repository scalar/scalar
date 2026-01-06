import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import type { ComponentsObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRefDeep } from '@/v2/blocks/operation-code-sample'

import { convertSecuritySchemeSecrets } from './convert-security-scheme-secrets'

/** Document security merged with the config security schemes */
export type MergedSecuritySchemes = NonNullable<ComponentsObject['securitySchemes']>

/** Merge the authentication config with the document security schemes */
export const mergeAuthConfig = (
  documentSecuritySchemes: ComponentsObject['securitySchemes'] = {},
  configSecuritySchemes: AuthenticationConfiguration['securitySchemes'] = {},
): MergedSecuritySchemes => {
  /** We need to resolve any refs here before we merge */
  const resolvedDocumentSecuritySchemes = getResolvedRefDeep(documentSecuritySchemes)

  /** Merge the config security schemes into the document security schemes */
  const mergedSchemes =
    mergeObjects<ComponentsObject['securitySchemes']>(resolvedDocumentSecuritySchemes, configSecuritySchemes) ?? {}

  /** Convert the config secrets to the new secret extensions */
  const convertedSchemes = Object.fromEntries(
    objectEntries(mergedSchemes).map(([key, value]) => [key, convertSecuritySchemeSecrets(value)]),
  )

  return convertedSchemes
}
