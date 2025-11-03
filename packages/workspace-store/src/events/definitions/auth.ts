import type { AuthMeta, SecuritySchemeUpdate } from '@/mutators/auth'
import type { SecurityRequirementObject, SecuritySchemeObject } from '@/schemas/v3.1/strict/openapi-document'

export type UpdateSecuritySchemeEvent =
  | {
      type: 'http'
      payload: Partial<{
        token: string
        username: string
        password: string
      }>
    }
  | {
      type: 'apiKey'
      payload: Partial<{
        name: string
        value: string
      }>
    }
  | {
      type: 'oauth2'
      flow: 'implicit' | 'password' | 'clientCredentials' | 'authorizationCode'
      payload: Partial<{
        authUrl: string
        tokenUrl: string
        token: string
        redirectUrl: string
        clientId: string
        clientSecret: string
        usePkce: 'no' | 'SHA-256' | 'plain'
        username: string
        password: string
      }>
    }

/** Event definitions for auth */
export type AuthEvents = {
  /**
   * Delete a security scheme
   */
  'delete:security-scheme': {
    /**
     * Names of the security scheme to delete
     *
     * Is an array to support complex auth
     */
    names: string[]
  }
  'update:security-scheme': {
    /** The data to update the security scheme with */
    data: SecuritySchemeUpdate
    /** The name of the security scheme to update */
    name: string
  }
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
  /** Currently selected auth index from the selected schemas list */
  'update:active-auth-index': {
    /** The index to update the active auth index to */
    index: number
    /** Meta information for the auth update */
    meta: AuthMeta
  }
  /**
   * Select the security schemes
   */
  'update:selected-security-schemes': {
    /** The security schemes to select */
    updated: SecurityRequirementObject[]
    /** The security schemes to create */
    create: { name: string; scheme: SecuritySchemeObject }[]
    /** Meta information for the auth update */
    meta: AuthMeta
  }
}
