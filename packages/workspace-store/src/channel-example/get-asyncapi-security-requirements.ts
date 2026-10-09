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
  owners: {
    servers?: Record<string, AsyncApiServerObject>
    operations?: Record<string, AsyncApiOperationObject>
  } = {},
): Record<string, AsyncApiSecuritySchemeObject> => {
  const components = document.components ? getResolvedRef(document.components) : undefined
  const schemes: Record<string, AsyncApiSecuritySchemeObject> = {}

  for (const [name, reference] of Object.entries(components?.securitySchemes ?? {})) {
    const scheme = getResolvedRef(reference)
    if (scheme) {
      schemes[name] = scheme
    }
  }

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
      schemes[getInlineSecuritySchemeName(document, scheme, location, index)] = scheme
    }
  }

  const servers = owners.servers ?? (document.servers ? getResolvedRef(document.servers) : undefined)
  for (const [name, reference] of Object.entries(servers ?? {})) {
    register(getResolvedRef(reference)?.security, `Server ${name}`)
  }
  const operations = owners.operations ?? (document.operations ? getResolvedRef(document.operations) : undefined)
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

/** Use declaration locations rather than object identity: traits can share the same object. */
const getInlineSecuritySchemeName = (
  document: AsyncApiDocument,
  scheme: AsyncApiSecuritySchemeObject,
  location: string,
  index: number,
): string => {
  const components = document.components ? getResolvedRef(document.components) : undefined
  const availableName = (name: string): string =>
    Object.hasOwn(components?.securitySchemes ?? {}, name) ? availableName(`${name} (inline)`) : name
  return availableName(`${location} · ${scheme.type} ${index + 1}`)
}

const securityEntryToRequirement = (
  document: AsyncApiDocument,
  entry: AsyncApiSecurityEntry,
  index: number,
  location: string | undefined,
  schemes: Record<string, AsyncApiSecuritySchemeObject>,
): SecurityRequirementObject | undefined => {
  const resolved = getResolvedRef(entry)
  const schemeName =
    getComponentSecuritySchemeName(document, entry) ??
    (resolved && 'type' in resolved && location !== undefined
      ? getInlineSecuritySchemeName(document, resolved, location, index)
      : Object.entries(schemes).find(([, scheme]) => scheme === resolved)?.[0])
  if (schemeName === undefined) {
    return undefined
  }

  const scopes = resolved != null && 'scopes' in resolved && Array.isArray(resolved.scopes) ? [...resolved.scopes] : []

  return { [schemeName]: scopes }
}

const collectSecurityRequirements = (
  document: AsyncApiDocument,
  security: AsyncApiSecurityEntry[] | undefined,
  location: string | undefined,
  schemes: Record<string, AsyncApiSecuritySchemeObject>,
): SecurityRequirementObject[] => {
  if (!security?.length) {
    return []
  }

  return security
    .map((entry, index) => securityEntryToRequirement(document, entry, index, location, schemes))
    .filter((requirement): requirement is SecurityRequirementObject => requirement != null)
}

/**
 * Converts AsyncAPI security arrays (operation, traits, server) into OpenAPI-style requirement objects.
 */
export const getAsyncApiSecurityRequirements = (
  document: AsyncApiDocument,
  operation?: AsyncApiOperationObject | null,
  server?: AsyncApiServerObject | null,
  locations: { operationName?: string; serverName?: string } = {},
): SecurityRequirementObject[] => {
  // Existing callers can omit locations. Build their fallback registry once, not once per entry.
  const needsRegistry =
    (operation?.security?.length && locations.operationName === undefined) ||
    (server?.security?.length && locations.serverName === undefined)
  const schemes = needsRegistry ? getAsyncApiSecuritySchemes(document) : {}
  const operationRequirements = collectSecurityRequirements(
    document,
    operation?.security,
    locations.operationName === undefined ? undefined : `Operation ${locations.operationName}`,
    schemes,
  )
  const serverRequirements = collectSecurityRequirements(
    document,
    server?.security,
    locations.serverName === undefined ? undefined : `Server ${locations.serverName}`,
    schemes,
  )

  if (operationRequirements.length === 0) {
    return dedupeRequirements(serverRequirements)
  }
  if (serverRequirements.length === 0) {
    return dedupeRequirements(operationRequirements)
  }
  const combined = operationRequirements.flatMap((operationRequirement) =>
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

  const resolvedServers = Object.entries(servers).map(([name, serverRef]) => ({
    name,
    server: getResolvedRef(serverRef),
  }))

  const perServerRequirements = resolvedServers.map(({ name, server }) =>
    getAsyncApiSecurityRequirements(document, null, server, { serverName: name }),
  )

  const combined = perServerRequirements.flat()

  // When some servers require auth while others accept unauthenticated connections, surface the
  // no-auth path as an optional `{}` requirement so those servers stay selectable. "No auth" is
  // keyed off the declared `security` array (absent or empty), not off a server whose declared
  // security failed to resolve to a scheme — that server still requires auth. If no server
  // requires auth at all, we return `[]` and let the selector treat every scheme as optional.
  const someRequireAuth = perServerRequirements.some((requirements) => requirements.length > 0)
  const someDeclareNoAuth = resolvedServers.some(({ server }) => !server?.security?.length)
  if (someRequireAuth && someDeclareNoAuth) {
    combined.push({})
  }

  return dedupeRequirements(combined)
}
