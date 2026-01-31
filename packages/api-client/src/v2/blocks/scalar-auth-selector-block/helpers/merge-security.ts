import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import type {
  ComponentsObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRefDeep } from '@/v2/blocks/operation-code-sample'

import { extractSecuritySchemeSecrets } from './extract-security-scheme-secrets'
import type { SecuritySchemeObjectSecret } from './secret-types'

/** Document security merged with the config security schemes */
export type MergedSecuritySchemes = Record<string, SecuritySchemeObjectSecret>

/** Merge the authentication config with the document security schemes + the auth store secrets */
export const mergeSecurity = (
  documentSecuritySchemes: ComponentsObject['securitySchemes'] = {},
  configSecuritySchemes: AuthenticationConfiguration['securitySchemes'] = {},
  authStore: AuthStore,
  documentSlug: string,
): MergedSecuritySchemes => {
  /** We need to resolve any refs here before we merge */
  const resolvedDocumentSecuritySchemes = structuredClone(getResolvedRefDeep(documentSecuritySchemes))

  /** Merge the config security schemes into the document security schemes */
  const mergedSchemes =
    mergeObjects<Record<string, SecuritySchemeObject>>(resolvedDocumentSecuritySchemes, configSecuritySchemes) ?? {}

  /** Convert the config secrets to the new secret extensions */
  return objectEntries(mergedSchemes).reduce((acc, [name, value]) => {
    // We resolved it deeply above so we can cast
    acc[name] = extractSecuritySchemeSecrets(value, authStore, name, documentSlug)
    return acc
  }, {} as MergedSecuritySchemes)
}
