import type { SecurityRequirementObject, SecuritySchemeObject } from '@/schemas/v3.1/strict/openapi-document'

/** Event definitions for auth */
export type AuthEvents = {
  /**
   * Add a new security scheme
   */
  'add:security-scheme': {
    /** The name of the security scheme to add */
    name: string
    /** The payload of the security scheme to add */
    scheme: SecuritySchemeObject
  }
  /**
   * Delete a security scheme
   */
  'delete:security-scheme': {
    /** Name of the security scheme to delete */
    name: string
  }
  /**
   * Select the security schemes
   */
  'update:selected-security-schemes': {
    /** The security schemes to select */
    schemes: SecurityRequirementObject
    /** The target at which the security schemes are selected */
    target: 'document' | 'operation'
  }
}
