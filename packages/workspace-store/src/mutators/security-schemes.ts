import type { SecuritySchemeObject } from '@/schemas/v3.1/strict/security-scheme'

/**
 * Provides mutator functions for managing security schemes within OpenAPI documents.
 * This module contains utilities for adding and deleting security schemes that are
 * stored in the document's components.securitySchemes object.
 *
 * @param document - The OpenAPI document to operate on
 * @returns Object containing mutator functions for security scheme operations
 */
export const securitySchemeMutators = (target?: Record<string, SecuritySchemeObject>) => {
  /**
   * Adds a new security scheme to the document's components.securitySchemes.
   * If a security scheme with the same type already exists, it will return false.
   *
   * @param securityScheme - The security scheme object to add
   * @returns true if the security scheme was added successfully, false if it already exists or document is missing
   *
   * @example
   * // Add a new API key security scheme
   * const success = addSecurityScheme({
   *   type: 'apiKey',
   *   name: 'api_key',
   *   in: 'header'
   * })
   *
   * if (success) {
   *   console.log('Security scheme added successfully')
   * } else {
   *   console.log('Security scheme already exists')
   * }
   */
  const addSecurityScheme = (name: string, securityScheme: SecuritySchemeObject) => {
    if (!target) {
      return false
    }

    target[name] = securityScheme
    return true
  }

  /**
   * Removes a security scheme from the document's components.securitySchemes by its name.
   * Returns false if the document, components, or securitySchemes object does not exist, otherwise deletes the security scheme and returns true.
   *
   * @param name - The name of the security scheme to remove
   * @returns true if the security scheme was deleted, false otherwise
   *
   * @example
   * // Remove an API key security scheme
   * deleteSecurityScheme('apiKey')
   */
  const deleteSecurityScheme = (name: string) => {
    if (!target || !target[name]) {
      return false
    }

    delete target[name]
    return true
  }

  return {
    addSecurityScheme,
    deleteSecurityScheme,
  }
}
