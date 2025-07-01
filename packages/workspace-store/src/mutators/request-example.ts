import type { WorkspaceStore } from '@/client'
import { getDocument } from '@/mutators/helpers'
import type { OperationIdentifier } from '@/mutators/request'
import type { XScalarClientConfigRequestExample } from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-request-example'
import { isReference } from '@/schemas/v3.1/type-guard'

/**
 * Provides mutator functions for managing request examples within OpenAPI operations.
 * This module contains utilities for adding and deleting request examples that are
 * stored as custom extensions on OpenAPI operations.
 * 
 * @param store - The workspace store containing the OpenAPI documents
 * @param documentName - The name of the document to operate on
 * @returns Object containing mutator functions for request example operations
 */
export const requestExampleMutators = (store: WorkspaceStore, documentName: string) => {
  const document = getDocument(store, documentName)

  /**
   * Adds a new request example to an OpenAPI operation.
   * Request examples are stored as custom extensions under the 'x-scalar-client-config-request-example' key.
   * 
   * @param path - The path of the operation to add the example to
   * @param method - The HTTP method of the operation
   * @param slug - A unique identifier for the request example
   * @param request - The request example configuration to add
   * @returns true if the example was successfully added, false otherwise
   * 
   * @example
   * // Add a request example for a POST operation
   * addRequestExample({
   *   path: '/users',
   *   method: 'post',
   *   slug: 'create-user',
   *   request: {
   *     body: { name: 'John Doe', email: 'john@example.com' },
   *     headers: { 'Content-Type': 'application/json' }
   *   }
   * })
   */
  const addRequestExample = ({
    path,
    method,
    slug,
    request,
  }: OperationIdentifier & { slug: string; request: XScalarClientConfigRequestExample }) => {
    if (!document || !document.paths) {
      return false
    }

    const pathObject = document.paths[path]

    if (!pathObject) {
      document.paths[path] = {}
    }

    if (!pathObject[method]) {
      pathObject[method] = {}
    }

    const operation = pathObject[method]

    if (isReference(operation)) {
      return false
    }

    // Create a new request example if it doesn't exist
    if (!operation['x-scalar-client-config-request-example']) {
      operation['x-scalar-client-config-request-example'] = {}
    }

    operation['x-scalar-client-config-request-example'][slug] = request
    return true
  }

  /**
   * Deletes a request example from an OpenAPI operation by its slug.
   * 
   * @param path - The path of the operation containing the example
   * @param method - The HTTP method of the operation
   * @param slug - The unique identifier of the request example to delete
   * @returns true if the example was successfully deleted, false otherwise
   * 
   * @example
   * // Delete a request example from a POST operation
   * deleteRequestExample({
   *   path: '/users',
   *   method: 'post',
   *   slug: 'create-user'
   * })
   */
  const deleteRequestExample = ({ path, method, slug }: OperationIdentifier & { slug: string }) => {
    if (!document) {
      return false
    }

    const pathObject = document?.paths?.[path]

    if (!pathObject) {
      return false
    }

    const operation = pathObject[method]

    if (!operation || isReference(operation)) {
      return false
    }

    if (!operation['x-scalar-client-config-request-example']) {
      return false
    }

    // Delete the request example by slug
    delete operation['x-scalar-client-config-request-example'][slug]
    return true
  }

  return {
    addRequestExample,
    deleteRequestExample,
  }
}
