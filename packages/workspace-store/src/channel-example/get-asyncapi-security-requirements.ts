import { isObjectEqual } from '@scalar/helpers/object/is-object-equal'
import type {
  AsyncApiDocument,
  AsyncApiOperationObject,
  AsyncApiSecuritySchemeObject,
  AsyncApiServerObject,
} from '@scalar/types/asyncapi/3.1'

import { getNameFromRef } from '@/helpers/get-name-from-ref'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { SecurityRequirementObject } from '@/schemas/v3.2/strict/security-requirement'

import { dedupeRequirements } from './dedupe-requirements'
import { resolveOperationWithTraits } from './resolve-operation-with-traits'

type AsyncApiSecurityEntry = NonNullable<AsyncApiOperationObject['security']>[number]

const getSecuritySchemeNameFromRef = (ref: string): string | undefined =>
  getNameFromRef(ref, ['components', 'securitySchemes'])

/** Strips requirement-only `scopes` so inline entries can match component scheme definitions. */
const getSecuritySchemeDefinition = (entry: AsyncApiSecurityEntry): AsyncApiSecuritySchemeObject | undefined => {
  const resolved: AsyncApiSecuritySchemeObject | undefined = getResolvedRef(entry)
  if (resolved == null) {
    return undefined
  }

  if (!('scopes' in resolved)) {
    return resolved
  }

  const { scopes: _scopes, ...scheme } = resolved
  return scheme
}

/**
 * Collect inline definitions without changing the API description. Location-based names keep
 * credentials for unrelated declarations separate, even when their definitions are identical.
 * Component names remain unchanged for existing auth configuration and persisted credentials.
 */
export const getAsyncApiSecuritySchemes = (
  document: AsyncApiDocument,
  includeOperations = true,
): Record<string, AsyncApiSecuritySchemeObject> => {
  const components = document.components ? getResolvedRef(document.components) : undefined
  const schemes: Record<string, AsyncApiSecuritySchemeObject> = {}

  for (const [name, reference] of Object.entries(components?.securitySchemes ?? {})) {
    const scheme = getResolvedRef(reference)
    if (scheme) {
      schemes[name] = scheme
    }
  }

  const availableName = (name: string): string =>
    Object.hasOwn(schemes, name) ? availableName(`${name} (inline)`) : name

  const register = (security: AsyncApiSecurityEntry[] | undefined, location: string): void => {
    for (const [index, entry] of (security ?? []).entries()) {
      const scheme = getResolvedRef(entry)
      if (!scheme || !('type' in scheme)) {
        continue
      }
      const componentName = getComponentSecuritySchemeName(document, entry)
      if (componentName !== undefined) {
        continue
      }
      // A user-defined component may have the same name as our generated label.
      const base = `${location} · ${scheme.type} ${index + 1}`
      schemes[availableName(base)] = scheme
    }
  }

  const servers = document.servers ? getResolvedRef(document.servers) : undefined
  for (const [name, reference] of Object.entries(servers ?? {})) {
    register(getResolvedRef(reference)?.security, `Server ${name}`)
  }
  if (!includeOperations) {
    return schemes
  }
  const operations = document.operations ? getResolvedRef(document.operations) : undefined
  for (const [name, reference] of Object.entries(operations ?? {})) {
    const operation = getResolvedRef(reference)
    if (operation) {
      register(resolveOperationWithTraits(operation).security, `Operation ${name}`)
    }
  }
  return schemes
}

const getComponentSecuritySchemeName = (
  document: AsyncApiDocument,
  entry: AsyncApiSecurityEntry,
): string | undefined => {
  if ('$ref' in entry) {
    const name = getSecuritySchemeNameFromRef(entry.$ref)
    if (name !== undefined) {
      return name
    }
  }
  const definition = getSecuritySchemeDefinition(entry)
  if (!definition) {
    return undefined
  }
  const components = document.components ? getResolvedRef(document.components) : undefined
  return Object.entries(components?.securitySchemes ?? {}).find(([, scheme]) =>
    isObjectEqual(getSecuritySchemeDefinition(scheme), definition),
  )?.[0]
}

const getSecuritySchemeName = (document: AsyncApiDocument, entry: AsyncApiSecurityEntry): string | undefined => {
  const componentName = getComponentSecuritySchemeName(document, entry)
  if (componentName !== undefined) {
    return componentName
  }
  const resolved = getResolvedRef(entry)
  return Object.entries(getAsyncApiSecuritySchemes(document)).find(([, scheme]) => scheme === resolved)?.[0]
}

const securityEntryToRequirement = (
  document: AsyncApiDocument,
  entry: AsyncApiSecurityEntry,
): SecurityRequirementObject | undefined => {
  const schemeName = getSecuritySchemeName(document, entry)
  if (schemeName === undefined) {
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
        : operationRequirements.flatMap((operationRequirement) =>
            serverRequirements.map((serverRequirement) => {
              const combined = { ...serverRequirement }
              for (const [name, scopes] of Object.entries(operationRequirement)) {
                combined[name] = [...new Set([...(combined[name] ?? []), ...(scopes ?? [])])]
              }
              return combined
            }),
          )

  return dedupeRequirements(combined)
}

/**
 * Document-wide security requirements for an AsyncAPI document.
 *
 * AsyncAPI has no root-level `security`; the closest document-wide scope is the union of every
 * server's security (a server applies to the whole connection). Operation-level security is
 * intentionally excluded here — that is per-channel and handled separately.
 */
export const getAsyncApiDocumentSecurityRequirements = (document: AsyncApiDocument): SecurityRequirementObject[] => {
  const servers = document.servers ? getResolvedRef(document.servers) : undefined
  if (!servers) {
    return []
  }

  const resolvedServers = Object.values(servers).map((serverRef) => getResolvedRef(serverRef))

  const perServerRequirements = resolvedServers.map((server) => getAsyncApiSecurityRequirements(document, null, server))

  const combined = perServerRequirements.flat()

  // When some servers require auth while others accept unauthenticated connections, surface the
  // no-auth path as an optional `{}` requirement so those servers stay selectable. "No auth" is
  // keyed off the declared `security` array (absent or empty), not off a server whose declared
  // security failed to resolve to a scheme — that server still requires auth. If no server
  // requires auth at all, we return `[]` and let the selector treat every scheme as optional.
  const someRequireAuth = perServerRequirements.some((requirements) => requirements.length > 0)
  const someDeclareNoAuth = resolvedServers.some((server) => !server?.security?.length)
  if (someRequireAuth && someDeclareNoAuth) {
    combined.push({})
  }

  return dedupeRequirements(combined)
}
