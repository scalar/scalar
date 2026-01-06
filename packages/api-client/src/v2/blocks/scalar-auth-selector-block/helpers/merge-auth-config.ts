import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type ComponentsObject,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { convertSecuritySchemeSecrets } from './convert-security-scheme-secrets'

/** Merge the authentication config with the document security schemes */
export const mergeAuthConfig = (
  documentSecuritySchemes: ComponentsObject['securitySchemes'] = {},
  configSecuritySchemes: AuthenticationConfiguration['securitySchemes'] = {},
): NonNullable<ComponentsObject['securitySchemes']> => {
  /** Merge the config security schemes into the document security schemes */
  const mergedSchemes =
    mergeObjects<ComponentsObject['securitySchemes']>(documentSecuritySchemes, configSecuritySchemes) ?? {}

  /** Convert the config secrets to the new secret extensions */
  const convertedSchemes = Object.fromEntries(
    objectEntries(mergedSchemes).map(([key, value]) => {
      const resolved = getResolvedRef(value)
      const converted = convertSecuritySchemeSecrets(resolved)
      const coerced = coerceValue(SecuritySchemeObjectSchema, converted)

      return [key, coerced]
    }),
  )

  return convertedSchemes
}
