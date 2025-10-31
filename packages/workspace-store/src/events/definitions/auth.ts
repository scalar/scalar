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
    payload: UpdateSecuritySchemeEvent
  }
  'update:selected-scopes': {
    id: string[]
    name: string
    scopes: string[]
  }
  /** Currently selected auth index from the selected schemas list */
  'update:active-auth-index': {
    index: number
  }
  /**
   * Select the security schemes
   */
  'update:selected-security-schemes': {
    /** The security schemes to select */
    updated: SecurityRequirementObject[]
    /** The security schemes to create */
    create: SecuritySchemeObject[]
  }
}
