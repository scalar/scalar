import { getSecuritySchemes } from '@scalar/api-client/v2/blocks/operation-block'
import type { MergedSecuritySchemes } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import { getSelectedSecurity, getSelectedServer } from '@scalar/api-client/v2/features/operation'
import { getServers } from '@scalar/api-client/v2/helpers'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { isObject } from '@scalar/helpers/object/is-object'
import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { XScalarSelectedSecurity } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-selected-security'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type {
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  PathItemObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  type SecuritySchemes,
  SecuritySchemesSchema,
  XScalarSelectedSecuritySchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { ToolUIPart, UIDataTypes, UIMessagePart } from 'ai'

import type { Tools } from '@/state/state'

/** Combine pathItem and operation parameters into a single, dereferenced parameter array */
export const combineParams = (
  pathParams: PathItemObject['parameters'] = [],
  operationParams: OperationObject['parameters'] = [],
): ParameterObject[] => {
  const allParams = [...pathParams, ...operationParams]
    .map((param) => getResolvedRef(param))
    // For unresolved params, coercion is going to generate a template object with an empty name, we don't want to include those
    .filter((e) => isDefined(e) && e.name)

  // Use a Map to ensure unique in+name combinations
  // Operation parameters take precedence over path parameters
  const uniqueParams = new Map<string, ParameterObject>()

  for (const param of allParams) {
    const key = `${param.in}:${param.name}`
    uniqueParams.set(key, param)
  }

  return Array.from(uniqueParams.values())
}

/**
 * Iterate through all available servers and pick the first one
 *
 * @example
 * getFirstServer([operation.servers, pathItem.servers, server])
 */
export function getFirstServer(
  ...availableServers: (ServerObject[] | ServerObject | undefined | null)[]
): ServerObject | undefined {
  for (const serverSource of availableServers) {
    if (!serverSource) {
      continue
    }

    // Handle single server object
    if (!Array.isArray(serverSource)) {
      const resolvedServer = getResolvedRef(serverSource) as ServerObject
      if (resolvedServer?.url) {
        return resolvedServer
      }
      continue
    }

    // Handle array of servers, pick the first one with a URL
    for (const server of serverSource) {
      const resolvedServer = getResolvedRef(server) as ServerObject
      if (resolvedServer?.url) {
        return resolvedServer
      }
    }
  }

  return undefined
}

/** Determine if a message part is a tool */
export function isToolPart(part: UIMessagePart<UIDataTypes, Tools>): part is ToolUIPart<Tools> {
  return part.type.startsWith('tool-')
}

/**
 * Extracts the default scopes for a security scheme.
 * Only OAuth2 schemes can have default scopes via the x-default-scopes extension.
 */
export const getDefaultScopes = (scheme: SecuritySchemeObject | undefined): string[] => {
  if (!scheme || scheme.type !== 'oauth2') {
    return []
  }

  return scheme['x-default-scopes'] ?? []
}

/**
 * Processes a single scheme name and adds it to the accumulator with its default scopes.
 */
const addSchemeToRequirement = (
  acc: SecurityRequirementObject,
  schemeName: string,
  securitySchemes: MergedSecuritySchemes,
): void => {
  const scheme = getResolvedRef(securitySchemes[schemeName])
  acc[schemeName] = getDefaultScopes(scheme)
}

/**
 * Converts the preferred security scheme configuration into a SecurityRequirementObject.
 * Handles both flat arrays and nested arrays (for complex auth scenarios).
 */
const buildSecurityRequirementFromPreferred = (
  preferredSecurityScheme: string | (string | string[])[],
  securitySchemes: MergedSecuritySchemes,
): SecurityRequirementObject => {
  if (!Array.isArray(preferredSecurityScheme)) {
    const scheme = getResolvedRef(securitySchemes[preferredSecurityScheme])
    return { [preferredSecurityScheme]: getDefaultScopes(scheme) }
  }

  const requirement: SecurityRequirementObject = {}

  for (const item of preferredSecurityScheme) {
    if (Array.isArray(item)) {
      // Handle nested arrays for complex auth (e.g., [['oauth2', 'apiKey'], 'basic'])
      for (const schemeName of item) {
        addSchemeToRequirement(requirement, schemeName, securitySchemes)
      }
    } else {
      addSchemeToRequirement(requirement, item, securitySchemes)
    }
  }

  return requirement
}

/**
 * Determines the default security scheme to use for an operation.
 *
 * Priority order:
 * 1. User-configured preferred security scheme (if provided)
 * 2. First security requirement from the OpenAPI spec
 * 3. null (no security required)
 */
export const getDefaultSecurity = (
  securityRequirements: SecurityRequirementObject[],
  preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'],
  securitySchemes: MergedSecuritySchemes,
): SecurityRequirementObject | null => {
  if (preferredSecurityScheme) {
    return buildSecurityRequirementFromPreferred(preferredSecurityScheme, securitySchemes)
  }

  const firstRequirement = securityRequirements[0]
  if (firstRequirement) {
    return unpackProxyObject(firstRequirement, { depth: 1 })
  }

  return null
}

/** Builds a quick cache key from the sorted object keys */
const getKey = (requirement: SecurityRequirementObject) => Object.keys(requirement).sort().join(',')

/**
 * Find the intersection between which security is selected on the document and what this operation requires
 *
 * If there is no overlap, we return the first requirement
 */
export const filterSelectedSecurity = (
  document: OpenApiDocument,
  operation: OperationObject | null,
  securitySchemes: MergedSecuritySchemes = {},
): SecuritySchemeObject[] => {
  const securityRequirements = operation?.security ?? document.security ?? []

  /** The selected security keys for the document */
  const selectedSecurity = getSelectedSecurity(
    document?.['x-scalar-selected-security'],
    operation?.['x-scalar-selected-security'],
  )

  /** Build a set for O(1) lookup */
  const requirementSet = new Set(securityRequirements.map((r) => getKey(r)))

  // Lets check the selectedIndex first
  const selectedRequirement = selectedSecurity.selectedSchemes[selectedSecurity.selectedIndex]
  if (selectedRequirement && requirementSet.has(getKey(selectedRequirement))) {
    return getSecuritySchemes(securitySchemes, [selectedRequirement])
  }

  // Otherwise lets loop over all selected
  for (const selected of selectedSecurity.selectedSchemes) {
    if (requirementSet.has(getKey(selected))) {
      return getSecuritySchemes(securitySchemes, [selected])
    }
  }

  /**
   * If we are selected security on the document,
   * we should show the first requirement of the operation to show auth is required
   */
  if (operation?.security?.length && !document?.['x-scalar-set-operation-security']) {
    return getSecuritySchemes(securitySchemes, securityRequirements.slice(0, 1))
  }

  return []
}

export function getOperations(doc: Partial<OpenAPIV3_1.Document>) {
  return Object.values(doc.paths ?? {}).flatMap((path) => Object.values(path ?? {})) as OperationObject[]
}

/** Flattens all security requirements from a document */
export function getSecurityFromDocument(document: WorkspaceDocument) {
  const selectedSchemes = document['x-scalar-selected-security']?.selectedSchemes ?? []

  const schemeKeys = selectedSchemes.flatMap((scheme) => Object.keys(scheme))

  const securitySchemes = document.components?.securitySchemes

  if (!securitySchemes) {
    return []
  }

  return schemeKeys.reduce<SecuritySchemeObject[]>((acc, cur) => {
    const security = securitySchemes[cur]

    if (security) {
      acc.push(getResolvedRef(security))
    }

    return acc
  }, [])
}

/** Generate document settings from workspace store */
export function createDocumentSettings(workspaceStore: WorkspaceStore) {
  return Object.fromEntries(
    Object.entries(workspaceStore.workspace.documents).map(([key, document]) => {
      const servers = getServers(document.servers, {
        documentUrl: document?.['x-scalar-original-source-url'],
      })

      return [
        key,
        {
          activeServer: getSelectedServer(document, servers),
          securitySchemes: getSecurityFromDocument(document),
        },
      ]
    }),
  )
}

// Local storage helper instance, safely wrapped.
const storage = safeLocalStorage()

/**
 * Provides an interface to store and retrieve the selected client value
 * in local storage.
 */
export const clientStorage = () => {
  const key = REFERENCE_LS_KEYS.SELECTED_CLIENT
  return {
    /**
     * Gets the stored selected client from local storage.
     */
    get: () => {
      return storage.getItem(key)
    },
    /**
     * Stores the selected client value in local storage.
     * @param value The value to store
     */
    set: (value: string) => {
      storage.setItem(key, value as string)
    },
  }
}

/**
 * Provides an interface to store and retrieve authentication scheme
 * information in local storage, including both the available schemes and
 * the user's selected schemes.
 */
export const authStorage = () => {
  const schemasKey = REFERENCE_LS_KEYS.AUTH_SCHEMES
  const selectedSchemesKey = REFERENCE_LS_KEYS.SELECTED_AUTH_SCHEMES

  const getAuthId = (type: 'schemas' | 'selectedSchemes', prefix: string) => {
    const getKey = (type: 'schemas' | 'selectedSchemes') => {
      return type === 'schemas' ? schemasKey : selectedSchemesKey
    }
    return `${prefix}-${getKey(type)}`
  }

  return {
    /**
     * Retrieves and coerces the authentication schemes stored in local storage.
     */
    getSchemas: (slug: string) => {
      const parsed = JSON.parse(storage.getItem(getAuthId('schemas', slug)) ?? '{}')
      return coerceValue(SecuritySchemesSchema, parsed)
    },
    /**
     * Stores the authentication schemes in local storage.
     * @param value The SecuritySchemes object to stringify and store.
     */
    setSchemas: (slug: string, value: SecuritySchemes) => {
      storage.setItem(getAuthId('schemas', slug), JSON.stringify(value))
    },
    /**
     * Retrieves and coerces the selected authentication schemes stored in local storage.
     */
    getSelectedSchemes: (slug: string) => {
      const parsed = JSON.parse(storage.getItem(getAuthId('selectedSchemes', slug)) ?? '{}')
      return coerceValue(XScalarSelectedSecuritySchema, parsed)
    },
    /**
     * Stores the user's selected authentication schemes in local storage.
     * @param value The XScalarSelectedSecurity object to stringify and store.
     */
    setSelectedSchemes: (slug: string, value: XScalarSelectedSecurity) => {
      storage.setItem(getAuthId('selectedSchemes', slug), JSON.stringify(value))
    },
  }
}

/**
 * Recursively merges secret values from stored data into the current schema.
 * Only merges secrets if the corresponding structure exists in the current schema.
 *
 * This function walks through both objects in parallel, copying any keys that
 * start with 'x-scalar-secret-' from the stored object to the current object,
 * but only if the path exists in the current schema.
 *
 * @param current - The current schema object (source of truth for structure)
 * @param stored - The stored object containing secret values to restore
 */
export const mergeSecrets = (current: unknown, stored: unknown): void => {
  if (!isObject(current) || !isObject(stored)) {
    return
  }

  // Iterate through stored keys to find secrets to restore
  for (const [key, storedValue] of Object.entries(stored)) {
    // If this is a secret key and it has a value, restore it to current
    if (typeof storedValue !== 'object') {
      current[key] = storedValue
      continue
    }

    // If the value is an object (and not null), recurse into it
    mergeSecrets(getResolvedRef(current[key]), storedValue)
  }
}

type SelectedSecurityScheme = NonNullable<
  XScalarSelectedSecurity['x-scalar-selected-security']
>['selectedSchemes'][number]

/**
 * Validates that all keys in a security scheme exist in the available schemes.
 */
const isSchemeValid = (scheme: SelectedSecurityScheme, availableSchemes: Set<string>): boolean =>
  Object.keys(scheme).every((key) => availableSchemes.has(key))

/**
 * Clamps the selected index to be within the valid range of schemes.
 * If the index is out of bounds, returns the last valid index.
 */
const clampSelectedIndex = (selectedIndex: number, schemesLength: number): number =>
  selectedIndex >= schemesLength ? schemesLength - 1 : selectedIndex

/**
 * Restores authentication secrets from local storage to the workspace store.
 *
 * This function iterates through stored authentication schemes and restores
 * any secret values (keys starting with x-scalar-secret-) to the active
 * document's security schemes. It uses the current security schemes as the
 * source of truth, only restoring secrets for structures that exist in the
 * current document.
 */
export const restoreAuthSecretsFromStorage = ({
  documentName,
  workspaceStore,
}: {
  documentName: string
  workspaceStore: WorkspaceStore
}): void => {
  const storedAuthSchemes = authStorage().getSchemas(documentName)

  const document = workspaceStore.workspace.documents[documentName]

  if (!document) {
    return
  }

  const authPersistence = authStorage()

  const storedSelectedAuthSchemes = authPersistence.getSelectedSchemes(documentName)

  const availableSchemes = new Set(Object.keys(document.components?.securitySchemes ?? {}))

  const selectedSchemes = storedSelectedAuthSchemes['x-scalar-selected-security']?.selectedSchemes

  const validSchemes = selectedSchemes?.filter((scheme) => isSchemeValid(scheme, availableSchemes))

  if (!document['x-scalar-selected-security'] && validSchemes && validSchemes.length > 0) {
    const selectedIdx = storedSelectedAuthSchemes['x-scalar-selected-security']?.selectedIndex

    const clampedIndex = clampSelectedIndex(selectedIdx ?? 0, validSchemes.length)

    document['x-scalar-selected-security'] = {
      selectedIndex: clampedIndex,
      selectedSchemes: validSchemes,
    }
  }

  const securitySchemes = document.components?.securitySchemes ?? {}

  for (const [key, storedScheme] of Object.entries(storedAuthSchemes)) {
    const currentScheme = getResolvedRef(securitySchemes[key])

    if (isObject(currentScheme)) {
      mergeSecrets(currentScheme, storedScheme)
    }
  }
}

export function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return
  }
}
