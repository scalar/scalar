import { isObjectEqual } from '@scalar/helpers/object/is-object-equal'
import type {
  AsyncApiDocument,
  AsyncApiOperationObject,
  AsyncApiSecuritySchemeObject,
  AsyncApiServerObject,
} from '@scalar/types/asyncapi/3.1'

import { getNameFromRef } from '@/helpers/get-name-from-ref'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'

type AsyncApiSecurityEntry = NonNullable<AsyncApiOperationObject['security']>[number]

const getSecuritySchemeNameFromRef = (ref: string): string | undefined =>
  getNameFromRef(ref, ['components', 'securitySchemes'])

/** Strips requirement-only `scopes` so inline entries can match component scheme definitions. */
const getSecuritySchemeDefinition = (entry: AsyncApiSecurityEntry): AsyncApiSecuritySchemeObject | undefined => {
  const resolved = getResolvedRef(entry) as AsyncApiSecuritySchemeObject | undefined
  if (resolved == null) {
    return undefined
  }

  if (!('scopes' in resolved)) {
    return resolved
  }

  const { scopes: _scopes, ...scheme } = resolved
  return scheme
}

const getSecuritySchemeName = (document: AsyncApiDocument, entry: AsyncApiSecurityEntry): string | undefined => {
  if ('$ref' in entry) {
    const nameFromRef = getSecuritySchemeNameFromRef(entry.$ref)
    if (nameFromRef) {
      return nameFromRef
    }
  }

  const resolvedDefinition = getSecuritySchemeDefinition(entry)
  if (resolvedDefinition == null) {
    return undefined
  }

  const components = document.components ? getResolvedRef(document.components) : undefined

  if (components?.securitySchemes) {
    for (const [name, schemeRef] of Object.entries(components.securitySchemes)) {
      const scheme = getResolvedRef(schemeRef)
      if (scheme === resolvedDefinition || isObjectEqual(scheme, resolvedDefinition)) {
        return name
      }
    }
  }

  return undefined
}

const securityEntryToRequirement = (
  document: AsyncApiDocument,
  entry: AsyncApiSecurityEntry,
): SecurityRequirementObject | undefined => {
  const schemeName = getSecuritySchemeName(document, entry)
  if (!schemeName) {
    return undefined
  }

  const resolved = getResolvedRef(entry)
  const scopes = resolved != null && 'scopes' in resolved && Array.isArray(resolved.scopes) ? [...resolved.scopes] : []

  return { [schemeName]: scopes }
}

const collectSecurityRequirements = (
  document: AsyncApiDocument,
  security: AsyncApiSecurityEntry[] | undefined,
): SecurityRequirementObject[] => {
  if (!security?.length) {
    return []
  }

  return security
    .map((entry) => securityEntryToRequirement(document, entry))
    .filter((requirement): requirement is SecurityRequirementObject => requirement != null)
}

/**
 * Converts AsyncAPI security arrays (operation, traits, server) into OpenAPI-style requirement objects.
 */
export const getAsyncApiSecurityRequirements = (
  document: AsyncApiDocument,
  operation?: AsyncApiOperationObject | null,
  server?: AsyncApiServerObject | null,
): SecurityRequirementObject[] => {
  const operationRequirements = collectSecurityRequirements(document, operation?.security)
  const serverRequirements = collectSecurityRequirements(document, server?.security)

  const combined =
    operationRequirements.length === 0
      ? serverRequirements
      : serverRequirements.length === 0
        ? operationRequirements
        : [...operationRequirements, ...serverRequirements]

  const seen = new Set<string>()

  return combined.filter((requirement) => {
    const key = JSON.stringify(requirement)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
