import type { SecurityRequirementObject, SecuritySchemeObject } from '@/schemas/v3.1/strict/openapi-document'

/** Event definitions for auth */
export type AuthEvents = {
  /**
   * Add a new security scheme
   *
   * @param name - The name of the security scheme
   * @param scheme - The payload of the security scheme to add
   */
  'add:security-scheme': {
    name: string
    scheme: SecuritySchemeObject
  }
  /**
   * Delete a security scheme
   *
   * @param name - The name of the security scheme to delete
   */
  'delete:security-scheme': {
    name: string
  }
  /**
   * Select the security schemes
   *
   * @param schemes - The security schemes to select
   * @param target - The target at which the security schemes are selected
   */
  'update:selected-security-schemes': {
    schemes: SecurityRequirementObject
    target: 'document' | 'operation'
  }
}
