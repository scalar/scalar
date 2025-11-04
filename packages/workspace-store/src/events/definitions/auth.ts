import type { AuthMeta, SecuritySchemeUpdate } from '@/mutators/auth'
import type { SecurityRequirementObject, SecuritySchemeObject } from '@/schemas/v3.1/strict/openapi-document'

/** Event definitions for auth */
export type AuthEvents = {
  /**
   * Update the selected security schemes for a document or specific operation.
   * Triggers when the user picks or adds new auth schemes in the UI.
   * - `selectedRequirements` is the current array of selected security requirement objects.
   * - `newSchemes` lists new security schemes (with names and definitions) to be created and added.
   * - `meta` describes the target (whole document or a specific operation).
   */
  'update:selected-security-schemes': {
    /** Security requirement objects representing the full updated selection */
    selectedRequirements: SecurityRequirementObject[]
    /** New security scheme definitions to add (name & scheme definition) */
    newSchemes: { name: string; scheme: SecuritySchemeObject }[]
    /** Meta describing update scope (document or operation) */
    meta: AuthMeta
  }

  /**
   * Update the currently active authentication tab index for the selected security schemes.
   * Fires when the user changes which authentication method is actively edited in the UI (e.g., switches between multiple selected auth schemes).
   * - `index` is the new active tab index to set.
   * - `meta` describes the update scope (document or specific operation).
   */
  'update:active-auth-index': {
    /** The index of the auth tab to set as active */
    index: number
    /** Meta information for the auth update */
    meta: AuthMeta
  }

  /**
   * Update a security scheme in the OpenAPI document's components object.
   * Use this event to update secret information or configuration for UI-auth flows,
   * such as username, password, tokens for HTTP/ApiKey/OAuth2 schemes.
   */
  'update:security-scheme': {
    /** The data to update the security scheme with */
    data: SecuritySchemeUpdate
    /** The name of the security scheme to update */
    name: string
  }

  /**
   * Update the selected scopes for a given security scheme.
   * Triggers when the user selects/deselects scopes for an OAuth2 (or other scopes-supporting) scheme in the UI.
   */
  'update:selected-scopes': {
    /** The id of the security scheme to update the scopes for */
    id: string[]
    /** The name of the security scheme to update the scopes for */
    name: string
    /** The scopes to update the selected scopes with */
    scopes: string[]
    /** Meta information for the auth update */
    meta: AuthMeta
  }

  /**
   * Delete one or more security schemes from the OpenAPI document.
   *
   * When triggered, removes the specified security scheme(s) from components.securitySchemes,
   * and also cleans up all associated document-level and operation-level references,
   * including selected security (x-scalar-selected-security) everywhere those schemes appear.
   *
   * - `names`: Array of security scheme names to delete. Array is used to support deleting multiple
   *   schemes at once, including multi-scheme (composite/complex) authentication scenarios.
   */
  'delete:security-scheme': {
    /** Names of the security schemes to delete */
    names: string[]
  }
}
