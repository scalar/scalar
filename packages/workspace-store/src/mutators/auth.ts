import type { WorkspaceStore } from '@/client'
import type { AuthEvents } from '@/events/definitions/auth'
import { generateUniqueValue } from '@/helpers/generate-unique-value'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isNonOptionalSecurityRequirement } from '@/helpers/is-non-optional-security-requirement'
import { mergeObjects } from '@/helpers/merge-object'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { getSelectedSecurity } from '@/request-example/context/security/get-selected-security'
import type { WorkspaceDocument } from '@/schemas'
import { isOpenApiDocument } from '@/schemas/type-guards'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'
import type { OAuth2Object } from '@/schemas/v3.1/strict/security-scheme'

/**
 * Updates the selected security schemes for either the entire document or a specific operation.
 * - Adds newly created security schemes (if any) to the workspace document's components.
 * - Ensures that each new scheme name is unique within the document by using `generateUniqueValue`.
 * - Updates the `x-scalar-selected-security` property on the target (document or operation) to reflect the new set of selected security schemes.
 * - Corrects and maintains the selected index so it points to a valid security scheme.
 *
 * @param document - The workspace OpenAPI document to mutate (can be null, in which case nothing happens)
 * @param selectedSecuritySchemes - The current list of selected security scheme objects
 * @param create - Array of new schemes to create, each with a name and a scheme definition
 * @param meta - Location to update: whole document or a specific operation (`{ type: 'document' }` or `{ type: 'operation', path, method }`)
 *
 * Example usage:
 * ```
 * updateSelectedSecuritySchemes({
 *   document,
 *   selectedSecuritySchemes: [{ bearerAuth: [] }],
 *   create: [
 *     { name: 'ApiKeyAuth', scheme: { type: 'apiKey', in: 'header', name: 'X-API-Key' } }
 *   ],
 *   meta: { type: 'document' }
 * })
 * ```
 */
export const updateSelectedSecuritySchemes = async (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { selectedRequirements, newSchemes, meta }: AuthEvents['auth:update:selected-security-schemes'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const documentName = document['x-scalar-navigation']?.name
  if (!documentName) {
    return
  }

  // Helper to get the target (whole document or a specific operation)
  const getTarget = () => {
    if (meta.type === 'document') {
      return store?.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    }

    return store?.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: meta.path, method: meta.method })
  }

  const createdSecurityRequirements = await Promise.all(
    newSchemes.map(async (newScheme) => {
      const uniqueSchemeName = await generateUniqueValue({
        defaultValue: newScheme.name,
        validation: (value) => !document.components?.securitySchemes?.[value],
        maxRetries: 100,
      })

      if (!uniqueSchemeName) {
        return
      }

      // Ensure components and securitySchemes exist
      if (!document.components) {
        document.components = {}
      }
      if (!document.components.securitySchemes) {
        document.components.securitySchemes = {}
      }

      // Add the new security scheme definition
      document.components.securitySchemes[uniqueSchemeName] = newScheme.scheme

      // Return an OpenAPI Security Requirement Object for this new scheme (empty scope array)
      return {
        [uniqueSchemeName]: [],
      }
    }),
  )

  // Create any new security schemes required, ensuring unique names for the components
  const createdSchemes = createdSecurityRequirements.filter(Boolean) as SecurityRequirementObject[]

  const target = getTarget()

  const newSelectedSecuritySchemes = [...selectedRequirements, ...createdSchemes]

  const getSelectedIndex = () => {
    if (!target?.selectedIndex) {
      return 0
    }

    if (target.selectedIndex >= newSelectedSecuritySchemes.length) {
      return newSelectedSecuritySchemes.length - 1
    }

    return target.selectedIndex
  }

  // if (payload. === 'document') {
  if (meta.type === 'document') {
    return store?.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: getSelectedIndex(), selectedSchemes: newSelectedSecuritySchemes },
    )
  }
  return store?.auth.setAuthSelectedSchemas(
    { type: 'operation', documentName, path: meta.path, method: meta.method },
    { selectedIndex: getSelectedIndex(), selectedSchemes: newSelectedSecuritySchemes },
  )
}

/**
 * Clears the selected security schemes from the workspace store for a document or operation.
 * This function will remove any selection state related to security (auth) for either the entire document
 * or for a specific operation if meta.type is 'operation'.
 * If the document name cannot be determined, nothing happens.
 */
const clearSelectedSecuritySchemes = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { meta }: AuthEvents['auth:clear:selected-security-schemes'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const documentName = document['x-scalar-navigation']?.name
  if (!documentName) {
    return
  }

  if (meta.type === 'document') {
    return store?.auth.clearAuthSelectedSchemas({ type: 'document', documentName })
  }
  return store?.auth.clearAuthSelectedSchemas({ type: 'operation', documentName, path: meta.path, method: meta.method })
}

/**
 * Updates a security scheme in the OpenAPI document's components object.
 * Handles updates for HTTP, API Key, and OAuth2 types, saving secret information and configuration for UI-auth flows.
 *
 * @param document - The OpenAPI workspace document (can be null)
 * @param data - The update information, including type and payload
 * @param name - The name of the security scheme in document.components.securitySchemes
 *
 * Example usage:
 *
 * updateSecurityScheme({
 *   document,
 *   data: {
 *     type: 'http',
 *     payload: {
 *       username: 'user123',
 *       password: 'pw123',
 *       token: 'tokenval'
 *     }
 *   },
 *   name: 'MyHttpAuth',
 * })
 */
export const updateSecurityScheme = (
  document: WorkspaceDocument | null,
  { payload, name }: AuthEvents['auth:update:security-scheme'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const target = getResolvedRef(document.components?.securitySchemes?.[name])
  if (!target) {
    console.error(`Security scheme ${name} not found`)
    return
  }

  // Handle HTTP (basic, bearer, etc.)
  if (target.type === payload.type) {
    mergeObjects(target, payload)
  }

  return target
}

const updateSecuritySchemeSecrets = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { payload, name, overwrite = false }: AuthEvents['auth:update:security-scheme-secrets'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const documentName = document['x-scalar-navigation']?.name
  if (!documentName) {
    return
  }

  // If we want to remove properties then we should set replace to true
  if (overwrite) {
    store?.auth.setAuthSecrets(documentName, name, payload)
    return
  }

  const auth = store?.auth.getAuthSecrets(documentName, name)
  const result = mergeObjects(
    unpackProxyObject(auth, { depth: 1 }) ?? {},
    payload,
  ) as AuthEvents['auth:update:security-scheme-secrets']['payload']
  store?.auth.setAuthSecrets(documentName, name, result)
}

const clearSecuritySchemeSecrets = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { name }: AuthEvents['auth:clear:security-scheme-secrets'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const documentName = document['x-scalar-navigation']?.name
  if (!documentName) {
    return
  }

  store?.auth.clearAuthSecrets(documentName, name)
}

/**
 * Sets the selected authentication tab (scheme) index for the given OpenAPI document or operation.
 * - When on the document level, updates the 'selectedIndex' on the document's x-scalar-selected-security extension.
 * - When on an operation (endpoint) level, updates the 'selectedIndex' for that operation's x-scalar-selected-security.
 *
 * Also initializes the x-scalar-selected-security extension if it does not exist.
 *
 * @param document The OpenAPI document object (may be null)
 * @param index The index to set as selected
 * @param meta Context where the selection applies ('document' or specific operation)
 *
 * @example
 * // Document-level tab selection
 * updateSelectedAuthTab({
 *   document,
 *   index: 1,
 *   meta: { type: 'document' }
 * });
 *
 * // Operation-level tab selection (e.g., GET /pets)
 * updateSelectedAuthTab({
 *   document,
 *   index: 0,
 *   meta: { type: 'operation', path: '/pets', method: 'get' }
 * });
 */
export const updateSelectedAuthTab = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { index, meta }: AuthEvents['auth:update:active-index'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const documentName = document['x-scalar-navigation']?.name
  if (!documentName) {
    return
  }

  // Ensure the path/method exists in the document
  if (meta.type === 'operation' && document.paths?.[meta.path]?.[meta.method] === undefined) {
    return
  }

  // Determine the target object for setting the auth tab index:
  // - Document/root level
  // - Operation/endpoint level (if meta specifies operation)
  const getTarget = () => {
    if (meta.type === 'document') {
      return store?.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    }
    return store?.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: meta.path, method: meta.method })
  }

  const target = getTarget()

  if (!target) {
    if (meta.type === 'document') {
      return store?.auth.setAuthSelectedSchemas(
        { type: 'document', documentName },
        { selectedIndex: index, selectedSchemes: [] },
      )
    }
    return store?.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName, path: meta.path, method: meta.method },
      { selectedIndex: index, selectedSchemes: [] },
    )
  }

  store?.auth.setAuthSelectedSchemas(
    meta.type === 'document'
      ? { type: 'document', documentName }
      : { type: 'operation', documentName, path: meta.path, method: meta.method },
    {
      selectedIndex: index,
      selectedSchemes: unpackProxyObject(target.selectedSchemes, { depth: null }) ?? [],
    },
  )
}

/**
 * Returns whether `id` lists the same scheme names as `requirement` (OpenAPI security requirement keys),
 * ignoring key order. UI payloads use `Object.keys(selectedSecuritySchemas)` which follows insertion order;
 * stored copies may serialize with a different order.
 */
const securityRequirementIdsMatch = (requirement: SecurityRequirementObject, id: readonly string[]): boolean => {
  const sortedRequirementKeys = [...Object.keys(requirement)].sort((a, b) => a.localeCompare(b))
  const sortedId = [...id].sort((a, b) => a.localeCompare(b))
  return JSON.stringify(sortedRequirementKeys) === JSON.stringify(sortedId)
}

/**
 * Updates the scopes for a specific security requirement in the selected security schemes of
 * a document or operation. This mutator only touches selection state; managing the scope
 * definitions on the OAuth flow is handled by `upsertScope` and `deleteScope`.
 *
 * @param document - The OpenAPI WorkspaceDocument to update.
 * @param id - An array of scheme names that uniquely identifies the target security requirement.
 *             For example: ['OAuth', 'ApiKeyAuth']
 * @param name - The security scheme name to update scopes for (e.g., 'OAuth').
 * @param scopes - The new list of scopes to set. For example: ['read:pets', 'write:pets']
 * @param meta - The context specifying whether the update is at the document-level or operation-level.
 *
 * Example usage:
 * ```ts
 * // Suppose your document (or operation) x-scalar-selected-security looks like:
 * // "x-scalar-selected-security": {
 * //   selectedIndex: 0,
 * //   selectedSchemes: [
 * //     { "OAuth": ["read:pets"] },
 * //     { "ApiKeyAuth": [] }
 * //   ]
 * // }
 *
 * updateSelectedScopes({
 *   document,
 *   id: ["OAuth"],     // identifies the scheme object: { "OAuth": [...] }
 *   name: "OAuth",     // scheme name to update within this security requirement
 *   scopes: ["write:pets"], // new scopes array
 *   meta: { type: "document" }
 * })
 * // After, the first scheme becomes: { "OAuth": ["write:pets"] }
 * ```
 */
export const updateSelectedScopes = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { id, name, scopes, meta }: AuthEvents['auth:update:selected-scopes'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const documentName = document['x-scalar-navigation']?.name
  if (!documentName) {
    return
  }

  // Determine the target object (document or the operation)
  const getTarget = () => {
    if (meta.type === 'document') {
      return store?.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    }
    return store?.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: meta.path, method: meta.method })
  }

  // Resolve the target lazily: only build a fallback selection when the store has none.
  //
  // We pass `[]` for security requirements because a `preferredSecurityScheme` is always
  // supplied (derived from `id`), which makes `getSelectedSecurity` build the requirement
  // from that scheme alone and never read the requirements array.
  const target =
    getTarget() ??
    getSelectedSecurity(
      undefined,
      undefined,
      [],
      (document.components?.securitySchemes ?? {}) as Record<
        string,
        { type?: string; 'x-default-scopes'?: string[] } | undefined
      >,
      id.length === 1 ? id[0] : id,
    )

  const nextSelectedSchemes = unpackProxyObject(target.selectedSchemes, { depth: 1 }) ?? []
  // Match the security requirement by scheme key names (order-insensitive: Object.keys order
  // can differ between the store copy and the UI payload for the same requirement object).
  const nextScheme = nextSelectedSchemes.find((candidate) => securityRequirementIdsMatch(candidate, id))
  if (!isNonOptionalSecurityRequirement(nextScheme)) {
    return
  }
  nextScheme[name] = scopes

  store?.auth.setAuthSelectedSchemas(
    meta.type === 'document'
      ? { type: 'document', documentName }
      : { type: 'operation', documentName, path: meta.path, method: meta.method },
    { selectedIndex: target.selectedIndex, selectedSchemes: nextSelectedSchemes },
  )
}

/**
 * Resolves the OAuth flow on a security scheme by name + flow type.
 * Returns `null` when the scheme or flow cannot be found, or the scheme is not an OAuth2 / OpenID Connect scheme.
 */
const resolveOAuthFlow = (document: WorkspaceDocument, name: string, flowType: keyof OAuth2Object['flows']) => {
  if (!isOpenApiDocument(document)) {
    return null
  }
  const securityScheme = getResolvedRef(document.components?.securitySchemes?.[name])
  if (!securityScheme) {
    return null
  }
  if (securityScheme.type !== 'oauth2' && securityScheme.type !== 'openIdConnect') {
    return null
  }
  return (securityScheme as OAuth2Object).flows?.[flowType] ?? null
}

/**
 * Walks every selection container that lives under a document (the document-level
 * `x-scalar-selected-security` plus the equivalent on every path / method) and invokes
 * `transform` on a plain copy of `selectedSchemes`, then writes back through
 * `setAuthSelectedSchemas` so persistence hooks run.
 */
const walkSelectedSchemes = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument,
  transform: (selectedSchemes: SecurityRequirementObject[]) => void,
) => {
  if (!isOpenApiDocument(document) || !store) {
    return
  }
  const documentName = document['x-scalar-navigation']?.name
  if (!documentName) {
    return
  }

  const apply = (
    payload:
      | { type: 'document'; documentName: string }
      | { type: 'operation'; documentName: string; path: string; method: string },
  ) => {
    const target = store.auth.getAuthSelectedSchemas(payload)
    if (!target) {
      return
    }
    const nextSchemes = unpackProxyObject(target.selectedSchemes, { depth: 1 }) ?? []
    transform(nextSchemes)
    store.auth.setAuthSelectedSchemas(payload, {
      selectedIndex: target.selectedIndex,
      selectedSchemes: nextSchemes,
    })
  }

  apply({ type: 'document', documentName })

  Object.entries(document.paths ?? {}).forEach(([path, pathItemObject]) => {
    Object.entries(pathItemObject).forEach(([method, operation]) => {
      if (typeof operation !== 'object') {
        return
      }
      apply({ type: 'operation', documentName, path, method })
    })
  })
}

/**
 * Adds a new scope to an OAuth flow, or renames / updates the description of an existing one.
 *
 * When `oldScope` differs from `scope`, this mutator also rewrites every selection entry
 * that references the matching security scheme so consumers do not need a follow-up
 * `auth:update:selected-scopes`.
 *
 * When `enable` is true, the resulting `scope` is additionally appended to every selection
 * requirement that already references this security scheme, enabling an "add and select"
 * flow without a separate selection mutation.
 */
export const upsertScope = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { name, flowType, scope, description, oldScope, enable }: AuthEvents['auth:upsert:scopes'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const flow = resolveOAuthFlow(document, name, flowType)
  if (!flow) {
    return
  }
  flow.scopes ||= {}

  const isRename = Boolean(oldScope) && oldScope !== scope

  // Rename: drop the previous key so iteration order stays predictable.
  if (isRename) {
    if (!(oldScope! in flow.scopes)) {
      return
    }
    delete flow.scopes[oldScope!]
  }

  flow.scopes[scope] = description

  if (!isRename && !enable) {
    return
  }

  // Mirror the rename and/or apply `enable` across selection entries that reference this scheme.
  walkSelectedSchemes(store, document, (selectedSchemes) => {
    selectedSchemes.forEach((requirement) => {
      if (!isNonOptionalSecurityRequirement(requirement)) {
        return
      }
      const scopes = requirement[name]
      if (!Array.isArray(scopes)) {
        return
      }

      let nextScopes = scopes

      // Rewrite the old key in place when this requirement had the renamed scope selected.
      if (isRename && nextScopes.includes(oldScope!)) {
        nextScopes = nextScopes.map((current) => (current === oldScope ? scope : current))
      }

      // Append the resulting scope when the caller asked for "add and select".
      if (enable && !nextScopes.includes(scope)) {
        nextScopes = [...nextScopes, scope]
      }

      if (nextScopes !== scopes) {
        requirement[name] = nextScopes
      }
    })
  })
}

/**
 * Removes a scope from an OAuth flow and strips it from any selection state that references
 * the matching security scheme.
 */
export const deleteScope = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { name, flowType, scope }: AuthEvents['auth:delete:scopes'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const flow = resolveOAuthFlow(document, name, flowType)
  if (!flow?.scopes) {
    return
  }
  delete flow.scopes[scope]

  walkSelectedSchemes(store, document, (selectedSchemes) => {
    selectedSchemes.forEach((requirement) => {
      if (!isNonOptionalSecurityRequirement(requirement)) {
        return
      }
      const scopes = requirement[name]
      if (!Array.isArray(scopes) || !scopes.includes(scope)) {
        return
      }
      requirement[name] = scopes.filter((current) => current !== scope)
    })
  })
}

/**
 * Deletes one or more security schemes from an OpenAPI WorkspaceDocument,
 * and removes all references to those schemes from selected security, document-level security,
 * and operation-level security/selected security (e.g., on paths).
 *
 * Example usage:
 *
 * ```ts
 * deleteSecurityScheme({
 *   document,                                // The OpenAPI document to update
 *   names: ['ApiKeyAuth', 'BearerAuth'],     // The names of security schemes you want to delete
 * });
 * ```
 *
 * After running this function:
 * - The named security schemes are removed from the components.securitySchemes section.
 * - All document-level and operation-level security entries referencing those schemes are removed.
 * - Any extended x-scalar-selected-security references to those schemes are also removed.
 */
export const deleteSecurityScheme = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { names }: AuthEvents['auth:delete:security-scheme'],
) => {
  if (!isOpenApiDocument(document)) {
    // Early exit if there is no document to modify
    return
  }
  const documentName = document['x-scalar-navigation']?.name
  if (!documentName) {
    return
  }

  // Get the mutable reference to securitySchemes in components (may be a proxy/resolved reference)
  const target = getResolvedRef(document.components?.securitySchemes)

  if (!target) {
    // If there are no security schemes to delete from, return early
    return
  }

  // Remove each named security scheme from the components.securitySchemes object
  names.forEach((name) => {
    delete target[name]
  })

  const clampIndex = (index: number, length: number) => {
    return Math.max(0, Math.min(index, length - 1))
  }

  // Function to remove any security requirement objects that reference given scheme names.
  const filterSecuritySchemes = (_schemes: SecurityRequirementObject[]) => {
    const schemes = unpackProxyObject(_schemes, { depth: 1 }) ?? []
    // Remove schemes whose key is included in the `names` to be deleted.
    return schemes.filter((scheme) => !names.some((name) => Object.keys(scheme).includes(name)))
  }

  const documentSelectedSecurity = store?.auth.getAuthSelectedSchemas({ type: 'document', documentName })

  // -- Remove from document-level `x-scalar-selected-security` extension, if present
  if (documentSelectedSecurity) {
    const filtered = filterSecuritySchemes(documentSelectedSecurity.selectedSchemes)
    store?.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      {
        selectedIndex: clampIndex(documentSelectedSecurity.selectedIndex, filtered.length),
        selectedSchemes: filtered,
      },
    )
  }

  // -- Remove from document-level `security` property, if present
  if (document['security']) {
    document['security'] = filterSecuritySchemes(document['security'])
  }

  // -- For each path and operation, remove deleted security schemes from operation-level security and custom extension
  Object.entries(document.paths ?? {}).forEach(([path, pathItemObject]) => {
    Object.entries(pathItemObject).forEach(([method, operation]) => {
      if (typeof operation !== 'object') {
        // Ignore operations that are not objects (could be undefined)
        return
      }

      // Get mutable reference for the operation (could resolve $ref proxies)
      const resolvedOperation = getResolvedRef(operation)

      // Remove from operation-level security array
      if ('security' in resolvedOperation && resolvedOperation['security']) {
        resolvedOperation['security'] = filterSecuritySchemes(resolvedOperation['security'])
      }

      const operationSelectedSecurity = store?.auth.getAuthSelectedSchemas({
        type: 'operation',
        documentName,
        path,
        method,
      })
      if (operationSelectedSecurity) {
        const filtered = filterSecuritySchemes(operationSelectedSecurity.selectedSchemes)
        store?.auth.setAuthSelectedSchemas(
          { type: 'operation', documentName, path, method },
          {
            selectedIndex: clampIndex(operationSelectedSecurity.selectedIndex, filtered.length),
            selectedSchemes: filtered,
          },
        )
      }
    })
  })
}

export const authMutatorsFactory = ({
  document,
  store,
}: {
  document: WorkspaceDocument | null
  store: WorkspaceStore | null
}) => {
  return {
    updateSelectedSecuritySchemes: (payload: AuthEvents['auth:update:selected-security-schemes']) =>
      updateSelectedSecuritySchemes(store, document, payload),
    clearSelectedSecuritySchemes: (payload: AuthEvents['auth:clear:selected-security-schemes']) =>
      clearSelectedSecuritySchemes(store, document, payload),
    updateSecurityScheme: (payload: AuthEvents['auth:update:security-scheme']) =>
      updateSecurityScheme(document, payload),
    updateSecuritySchemeSecrets: (payload: AuthEvents['auth:update:security-scheme-secrets']) =>
      updateSecuritySchemeSecrets(store, document, payload),
    clearSecuritySchemeSecrets: (payload: AuthEvents['auth:clear:security-scheme-secrets']) =>
      clearSecuritySchemeSecrets(store, document, payload),
    updateSelectedAuthTab: (payload: AuthEvents['auth:update:active-index']) =>
      updateSelectedAuthTab(store, document, payload),
    updateSelectedScopes: (payload: AuthEvents['auth:update:selected-scopes']) =>
      updateSelectedScopes(store, document, payload),
    upsertScope: (payload: AuthEvents['auth:upsert:scopes']) => upsertScope(store, document, payload),
    deleteScope: (payload: AuthEvents['auth:delete:scopes']) => deleteScope(store, document, payload),
    deleteSecurityScheme: (payload: AuthEvents['auth:delete:security-scheme']) =>
      deleteSecurityScheme(store, document, payload),
  }
}
