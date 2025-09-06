import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

export type OperationIdentifier = {
  path: string
  method: Exclude<HttpMethod, 'connect' | 'head' | 'options'>
}

/**
 * Provides mutator functions for managing OpenAPI operations (requests) within a workspace store.
 * This module contains utilities for moving and deleting API operations while maintaining
 * document integrity and preventing conflicts.
 *
 * @param document - The OpenAPI document to operate on
 * @returns Object containing mutator functions for request operations
 */
export const requestMutators = (document?: OpenApiDocument) => {
  /**
   * Moves an operation from one path/method to another within the OpenAPI document.
   * This function handles the relocation of API operations while preserving their configuration
   * and preventing accidental overwrites of existing operations.
   *
   * @param source - The current location of the operation to move
   * @param destination - The target location for the operation (path and/or method)
   * @returns true if the operation was successfully moved, false otherwise
   *
   * @example
   * // Move an operation to a completely new path and method
   * moveOperation({
   *   source: { path: '/old-endpoint', method: 'get' },
   *   destination: { path: '/new-endpoint', method: 'post' }
   * })
   */
  const moveOperation = ({
    source,
    destination,
  }: {
    source: OperationIdentifier
    destination: OperationIdentifier
  }) => {
    if (!document || !document.paths) {
      return false
    }

    const pathObject = document.paths[source.path]

    if (!pathObject) {
      return false
    }

    const operation = pathObject[source.method]

    if (!operation) {
      return false
    }

    const newPath = destination.path || source.path
    const newMethod = destination.method || source.method

    if (document.paths[newPath]?.[newMethod]) {
      // If the new path and method already exist, we should not overwrite it.
      console.warn(`Request already exists at ${newPath} with method ${newMethod}.`)
      return false
    }

    // delete the request from the old location
    delete pathObject[source.method]

    if (!document.paths[newPath]) {
      // If the new path does not exist, create it
      document.paths[newPath] = {}
    }

    document.paths[newPath][newMethod] = operation
    return true
  }

  /**
   * Deletes an operation from the OpenAPI document at the specified path and method.
   *
   * @param path - The path of the operation to delete
   * @param method - The HTTP method of the operation to delete
   * @returns void - Returns early if document, path, or operation doesn't exist
   *
   * @example
   * // Delete a GET operation from /users endpoint
   * deleteRequest({ path: '/users', method: 'get' })
   *
   * @example
   * // Delete a POST operation from /auth/login endpoint
   * deleteRequest({ path: '/auth/login', method: 'post' })
   */
  const deleteRequest = ({ path, method }: OperationIdentifier) => {
    if (!document) {
      return false
    }

    const pathObject = document?.paths?.[path]

    if (!pathObject) {
      return false
    }

    const operation = pathObject[method]

    if (!operation) {
      return false
    }

    // Delete the request by slug
    delete pathObject[method]
    return true
  }

  return {
    moveRequest: moveOperation,
    deleteRequest,
  }
}
