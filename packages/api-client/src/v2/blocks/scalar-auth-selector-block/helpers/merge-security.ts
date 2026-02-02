import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type {
  ComponentsObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

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
  /** Resolve any refs in the document security schemes */
  const resolvedDocumentSecuritySchemes = objectEntries(documentSecuritySchemes).reduce(
    (acc, [key, value]) => {
      // Use structuredClone to ensure we don't mutate the original object when we merge
      acc[key] = structuredClone(unpackProxyObject(getResolvedRef(value)))
      return acc
    },
    {} as Record<string, SecuritySchemeObject>,
  )

  /** Merge the config security schemes into the document security schemes */
  const mergedSchemes =
    mergeObjects<Record<string, SecuritySchemeObject>>(resolvedDocumentSecuritySchemes, configSecuritySchemes) ?? {}

  /** Convert the config secrets to the new secret extensions */
  return objectEntries(mergedSchemes).reduce((acc, [name, value]) => {
    acc[name] = extractSecuritySchemeSecrets(value, authStore, name, documentSlug)
    return acc
  }, {} as MergedSecuritySchemes)
}
