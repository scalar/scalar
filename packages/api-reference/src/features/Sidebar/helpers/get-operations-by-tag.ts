import type { OperationSortOption } from '@/features/Sidebar/types'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Takes an OpenAPI Document and a tag, and returns an array of operations that have the tag.
 */
export function getOperationsByTag(
  content: OpenAPIV3_1.Document,
  tag: OpenAPIV3_1.TagObject,
  { sort, filter }: OperationSortOption & { filter?: (operation: OpenAPIV3_1.OperationObject) => boolean } = {},
) {
  const operations: {
    method: OpenAPIV3_1.HttpMethods
    path: string
    operation: OpenAPIV3_1.OperationObject
  }[] = []

  if (!content.paths) {
    return operations
  }

  // Loop through all paths in the document
  Object.entries(content.paths).forEach(([path, pathItem]) => {
    if (!pathItem) {
      return
    }

    // Loop through all HTTP methods in the path
    Object.entries(pathItem).forEach(([method, operation]) => {
      // Skip if not an operation
      if (typeof operation === 'string') {
        return
      }

      // Skip if the operation doesn't match the filter
      if (filter && !filter(operation)) {
        return
      }

      // For default tag, include operations without tags
      // TODO: Make the 'default' tag configurable
      if (tag.name === 'default') {
        if (!operation?.tags) {
          operations.push({
            method: method.toUpperCase() as OpenAPIV3_1.HttpMethods,
            path,
            operation,
          })
        }
        return
      }

      // For other tags, only include operations that have the tag
      if (operation?.tags?.includes(tag.name)) {
        operations.push({
          method: method.toUpperCase() as OpenAPIV3_1.HttpMethods,
          path,
          operation,
        })
      }
    })
  })

  // Sort operations by path
  if (sort === 'alpha') {
    return operations.sort((a, b) => a.path.localeCompare(b.path))
  }

  // Sort operations by method
  if (sort === 'method') {
    return operations.sort((a, b) => a.method.localeCompare(b.method))
  }

  // Sort operations by a custom function
  if (typeof sort === 'function') {
    // TODO: We need the path and method
    // TODO: Do we need to make sure we’re backwards compatible with the old sort function?
    return operations.sort((a, b) => sort(a.operation, b.operation))
  }

  return operations
}
