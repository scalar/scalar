import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { OperationIdentifier } from '@/mutators/request'
import type { WorkspaceDocument } from '@/schemas'
import type { XScalarClientConfigRequestExample } from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-request-example'

/**
 * Provides mutator functions for managing request examples within OpenAPI operations.
 * This module contains utilities for adding and deleting request examples that are
 * stored as custom extensions on OpenAPI operations.
 *
 * @param document - The workspace document to operate on
 * @returns Object containing mutator functions for request example operations
 */
export const requestExampleMutators = (document?: WorkspaceDocument) => {
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

    if (!document.paths[path]) {
      document.paths[path] = {}
    }

    if (!document.paths[path][method]) {
      document.paths[path][method] = {}
    }

    const operation = getResolvedRef(document.paths[path][method])

    // Create a new request example if it doesn't exist
    if (!operation['x-scalar-client-config-request-example']) {
      operation['x-scalar-client-config-request-example'] = {}
    }

    if (operation['x-scalar-client-config-request-example'][slug]) {
      console.warn(`Request example with slug "${slug}" already exists for ${method.toUpperCase()} ${path}.`)
      return false
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

    const operation = getResolvedRef(pathObject[method])

    if (!operation) {
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
