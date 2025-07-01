import type { WorkspaceStore } from '@/client'
import { getDocument } from '@/mutators/helpers'
import type { SecuritySchemeObject } from '@/schemas/v3.1/strict/security-scheme'

/**
 * Security Scheme mutators for managing security schemes in OpenAPI documents.
 * Provides functions to add and delete security schemes from the document's components.securitySchemes object.
 *
 * @param store - The workspace store containing the documents
 * @param documentName - The name of the document to operate on
 * @returns Object containing addSecurityScheme and deleteSecurityScheme functions
 */
export const securitySchemeMutators = (store: WorkspaceStore, documentName: string) => {
  const document = getDocument(store, documentName)

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
  const addSecurityScheme = (securityScheme: SecuritySchemeObject) => {
    if (!document) {
      return false
    }

    if (!document.components) {
      document.components = {}
    }

    if (!document.components.securitySchemes) {
      document.components.securitySchemes = {}
    }

    if (document.components.securitySchemes[securityScheme.type]) {
      return false
    }

    document.components.securitySchemes[securityScheme.type] = securityScheme
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
    if (!document || !document.components || !document.components.securitySchemes) {
      return false
    }

    delete document.components.securitySchemes[name]
    return true
  }

  return {
    addSecurityScheme,
    deleteSecurityScheme,
  }
}
