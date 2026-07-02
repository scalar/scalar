import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { AsyncApiComponentsObject, AsyncApiSecuritySchemeObject } from '@scalar/types/asyncapi/3.1'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type ComponentsObject,
  type SecuritySchemeObject,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'

import { extractSecuritySchemeSecrets } from './extract-security-scheme-secrets'

/** Document security merged with the config security schemes */
export type MergedSecuritySchemes = Record<string, SecuritySchemeObjectSecret>

/**
 * Merge the authentication config with the document security schemes + the auth store secrets.
 *
 * AsyncAPI keeps its security schemes in the same `components.securitySchemes` slot and shares the
 * `http`/`apiKey`/`oauth2`/`openIdConnect` shapes with OpenAPI, so we accept either spec's schemes
 * here. Every value is coerced into the OpenAPI `SecuritySchemeObject` shape below, so broker-specific
 * AsyncAPI types still flow through and degrade gracefully downstream.
 */
export const mergeSecurity = (
  documentSecuritySchemes:
    | ComponentsObject['securitySchemes']
    | NonNullable<AsyncApiComponentsObject['securitySchemes']> = {},
  configSecuritySchemes: AuthenticationConfiguration['securitySchemes'] = {},
  authStore: AuthStore,
  documentName: string,
  oauth2RedirectUri?: string,
): MergedSecuritySchemes => {
  /** Resolve any refs in the document security schemes */
  const resolvedDocumentSecuritySchemes = objectEntries(documentSecuritySchemes).reduce(
    (acc, [key, value]) => {
      const resolved = deepClone(getResolvedRef(value))
      if (resolved) {
        acc[key] = resolved
      }
      return acc
    },
    {} as Record<string, SecuritySchemeObject | AsyncApiSecuritySchemeObject>,
  )

  /** Merge the config security schemes into the document security schemes */
  const mergedSchemes =
    mergeObjects<Record<string, SecuritySchemeObject | AsyncApiSecuritySchemeObject>>(
      resolvedDocumentSecuritySchemes,
      configSecuritySchemes,
    ) ?? {}

  /** Convert the config secrets to the new secret extensions */
  return objectEntries(mergedSchemes).reduce((acc, [name, value]) => {
    // We coerce in case the scheme is missing any key fields like type
    const coerced = coerceValue(SecuritySchemeObjectSchema, value)
    // We then overwrite it back with the original value to keep any other fields like description, etc.
    // `coerced` has already laundered the value into the OpenAPI shape (including any AsyncAPI scheme),
    // so we narrow here to restore the extra fields without re-widening the type.
    const merged = { ...coerced, ...(value as SecuritySchemeObject) }

    acc[name] = extractSecuritySchemeSecrets(merged, authStore, name, documentName, oauth2RedirectUri)
    return acc
  }, {} as MergedSecuritySchemes)
}
