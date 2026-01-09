import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import type { AuthEvents } from '@/events/definitions/auth'
import { generateUniqueValue } from '@/helpers/generate-unique-value'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isNonOptionalSecurityRequirement } from '@/helpers/is-non-optional-security-requirement'
import { mergeObjects } from '@/helpers/merge-object'
import type { WorkspaceDocument } from '@/schemas'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'
import type { OAuth2Object } from '@/schemas/v3.1/strict/security-scheme'

/**
 * AuthMeta defines the meta information needed to specify whether the authentication operation
 * is being performed at the document level (entire API), or for a specific operation (specific path and method).
 *
 * - If type is 'document', the operation applies to the whole OpenAPI document.
 * - If type is 'operation', it targets a specific operation, identified by its path and method.
 */
export type AuthMeta =
  | {
      type: 'document'
    }
  | {
      type: 'operation'
      path: string
      method: HttpMethod
    }

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
  document: WorkspaceDocument | null,
  { selectedRequirements, newSchemes, meta }: AuthEvents['auth:update:selected-security-schemes'],
) => {
  if (!document) {
    return
  }

  // Helper to get the target (whole document or a specific operation)
  const getTarget = () => {
    if (meta.type === 'document') {
      return document
    }

    return getResolvedRef(document.paths?.[meta.path]?.[meta.method])
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

  // If the target (document/operation) doesn't exist, do nothing
  if (!target) {
    return
  }

  // Ensure the x-scalar-selected-security structure exists on the target
  if (!target['x-scalar-selected-security']) {
    target['x-scalar-selected-security'] = {
      selectedIndex: -1,
      selectedSchemes: [],
    }
  }

  const selectedIndex = target['x-scalar-selected-security'].selectedIndex

  // Update the schemes array
  target['x-scalar-selected-security'].selectedSchemes = newSelectedSecuritySchemes

  // Adjust selected index if there are schemes and the index is unset/invalid
  if (newSelectedSecuritySchemes.length > 0 && selectedIndex < 0) {
    target['x-scalar-selected-security'].selectedIndex = 0
  }

  // If the selected index is now out of bounds, select the last available
  if (selectedIndex >= newSelectedSecuritySchemes.length) {
    target['x-scalar-selected-security'].selectedIndex = newSelectedSecuritySchemes.length - 1
  }
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
  const target = getResolvedRef(document?.components?.securitySchemes?.[name])
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
  document: WorkspaceDocument | null,
  { index, meta }: AuthEvents['auth:update:active-index'],
) => {
  if (!document) {
    return
  }

  // Determine the target object for setting the auth tab index:
  // - Document/root level
  // - Operation/endpoint level (if meta specifies operation)
  const getTarget = () => {
    if (meta.type === 'document') {
      return document
    }
    return getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  }

  const target = getTarget()
  if (!target) {
    return
  }

  // Ensure the 'x-scalar-selected-security' extension exists
  if (!target['x-scalar-selected-security']) {
    target['x-scalar-selected-security'] = {
      selectedIndex: 0,
      selectedSchemes: [],
    }
  }

  // Set the selected auth tab index
  target['x-scalar-selected-security'].selectedIndex = index
}

/**
 * Updates the scopes for a specific security requirement in the selected security schemes of
 * a document or operation. Also allow to add a new scope to the scheme.
 *
 * @param document - The OpenAPI WorkspaceDocument to update.
 * @param id - An array of scheme names that uniquely identifies the target security requirement.
 *             For example: ['OAuth', 'ApiKeyAuth']
 * @param name - The security scheme name to update scopes for (e.g., 'OAuth').
 * @param scopes - The new list of scopes to set. For example: ['read:pets', 'write:pets']
 * @param newScopePayload - The payload to add a new scope with
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
  document: WorkspaceDocument | null,
  { id, name, scopes, newScopePayload, meta }: AuthEvents['auth:update:selected-scopes'],
) => {
  if (!document) {
    return
  }

  // Determine the target object (document or the operation)
  const getTarget = () => {
    if (meta.type === 'document') {
      return document
    }
    return getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  }

  const target = getTarget()
  if (!target) {
    return
  }

  // Array of security requirement objects under x-scalar-selected-security
  const selectedSchemes = target['x-scalar-selected-security']?.selectedSchemes
  if (!selectedSchemes) {
    return
  }

  // Find the security requirement that matches the given id (scheme key names)
  // For example: if id = ["OAuth"], matches { OAuth: [...] }
  const scheme = selectedSchemes.find((scheme) => JSON.stringify(Object.keys(scheme)) === JSON.stringify(id))

  // If the scheme is optional, do nothing as it cannot have scopes
  if (!isNonOptionalSecurityRequirement(scheme)) {
    return
  }

  // If we have a new scope payload, add it to the scheme
  if (newScopePayload) {
    const securityScheme = getResolvedRef(document.components?.securitySchemes?.[name])
    const flow = (securityScheme as OAuth2Object)?.flows?.[newScopePayload?.flowType]
    if (!flow) {
      return
    }

    flow.scopes[newScopePayload.name] = newScopePayload.description
    scheme[name] = [...scopes, newScopePayload.name]
    return
  }

  // Set the scopes array for the named security scheme within the found security requirement
  scheme[name] = scopes
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
  document: WorkspaceDocument | null,
  { names }: AuthEvents['auth:delete:security-scheme'],
) => {
  if (!document) {
    // Early exit if there is no document to modify
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

  // Function to remove any security requirement objects that reference given scheme names.
  const filterSecuritySchemes = (schemes: SecurityRequirementObject[]) => {
    // Remove schemes whose key is included in the `names` to be deleted.
    return schemes.filter((scheme) => !names.some((name) => Object.keys(scheme).includes(name)))
  }

  // -- Remove from document-level `x-scalar-selected-security` extension, if present
  if (document['x-scalar-selected-security']) {
    const selectedSecurity = document['x-scalar-selected-security']
    selectedSecurity.selectedSchemes = filterSecuritySchemes(selectedSecurity.selectedSchemes)
  }

  // -- Remove from document-level `security` property, if present
  if (document['security']) {
    document['security'] = filterSecuritySchemes(document['security'])
  }

  // -- For each path and operation, remove deleted security schemes from operation-level security and custom extension
  Object.values(document.paths ?? {}).forEach((path) => {
    Object.values(path).forEach((operation) => {
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

      // Remove from operation-level x-scalar-selected-security array
      if ('x-scalar-selected-security' in resolvedOperation && resolvedOperation['x-scalar-selected-security']) {
        resolvedOperation['x-scalar-selected-security'].selectedSchemes = filterSecuritySchemes(
          resolvedOperation['x-scalar-selected-security'].selectedSchemes,
        )
      }
    })
  })
}
