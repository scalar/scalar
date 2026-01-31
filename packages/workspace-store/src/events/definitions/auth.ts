import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { PartialDeep } from 'type-fest'

import type { SecretsAuth } from '@/entities/auth/schema'
import type {
  OAuthFlowsObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
} from '@/schemas/v3.1/strict/openapi-document'
import type { ApiKeyObject, HttpObject, OAuth2Object } from '@/schemas/v3.1/strict/security-scheme'

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
 * SecuritySchemeUpdate represents the possible updates that can be made
 * to an OpenAPI security scheme object via UI interactions.
 *
 * - `http`: Updates to HTTP type schemes (e.g. basic, bearer), allowing token, username, and password changes.
 * - `apiKey`: Updates to API Key type schemes, allowing the key name and its value to be updated.
 * - `oauth2`: Updates to OAuth2 type schemes for each supported OAuth2 flow.
 *    - Can set various properties such as auth/token URLs, tokens, PKCE method, client credentials, etc.
 */
type SecuritySchemeUpdatePayload =
  | ({
      type: 'http'
    } & Partial<Omit<HttpObject, 'type'>>)
  | ({
      type: 'apiKey'
    } & Partial<Omit<ApiKeyObject, 'type'>>)
  | ({
      type: 'oauth2'
    } & PartialDeep<Omit<OAuth2Object, 'type'>>)

/** Event definitions for auth */
export type AuthEvents = {
  /**
   * Update the selected security schemes for a document or specific operation.
   * Triggers when the user picks or adds new auth schemes in the UI.
   * - `selectedRequirements` is the current array of selected security requirement objects.
   * - `newSchemes` lists new security schemes (with names and definitions) to be created and added.
   * - `meta` describes the target (whole document or a specific operation).
   */
  'auth:update:selected-security-schemes': {
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
  'auth:update:active-index': {
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
  'auth:update:security-scheme': {
    /** The data to update the security scheme with */
    payload: SecuritySchemeUpdatePayload
    /** The name of the security scheme to update */
    name: string
  }

  /**
   * Update a security scheme in the OpenAPI document's components object.
   * Use this event to update secret information or configuration for UI-auth flows,
   * such as username, password, tokens for HTTP/ApiKey/OAuth2 schemes.
   */
  'auth:update:security-scheme-secrets': {
    /** The data to update the security scheme with */
    payload: PartialDeep<SecretsAuth[string]> & { type: SecretsAuth[string]['type'] }
    /** The name of the security scheme to update */
    name: string
  }

  /**
   * Update the selected scopes for a given security scheme.
   * Triggers when the user selects/deselects scopes for an OAuth2 (or other scopes-supporting) scheme in the UI.
   */
  'auth:update:selected-scopes': {
    /** The id of the security scheme to update the scopes for */
    id: string[]
    /** The name of the security scheme to update the scopes for */
    name: string
    /** The scopes to update the selected scopes with */
    scopes: string[]
    /** We can add a new scope as well then select it */
    newScopePayload?: {
      name: string
      description: string
      flowType: keyof OAuthFlowsObject
    }
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
  'auth:delete:security-scheme': {
    /** Names of the security schemes to delete */
    names: string[]
  }
}
