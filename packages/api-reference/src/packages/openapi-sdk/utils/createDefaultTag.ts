import type { OpenAPI } from '@scalar/openapi-types'

export function createDefaultTag(content: OpenAPI.Document): OpenAPI.Document {
  const defaultTag: OpenAPI.Tag = {
    name: 'default',
    description: '',
  }

  // Check if there are any operations without tags
  const hasUntaggedOperations = Object.values(content.paths || {}).some(
    (pathItem: OpenAPI.PathItem) =>
      Object.values(pathItem || {}).some(
        (operation) =>
          typeof operation === 'object' &&
          (!operation?.tags || operation?.tags?.length === 0),
      ),
  )

  if (hasUntaggedOperations) {
    // Add the default tag if it doesn't exist
    if (!content.tags) {
      content.tags = []
    }
    if (!content.tags.some((tag: OpenAPI.Tag) => tag.name === 'default')) {
      content.tags.push(defaultTag)
    }

    // Assign the default tag to operations without tags
    Object.values(content.paths || {}).forEach((pathItem: OpenAPI.PathItem) => {
      Object.values(pathItem || {}).forEach((operation: OpenAPI.Operation) => {
        if (
          typeof operation === 'object' &&
          (!operation.tags || operation.tags.length === 0)
        ) {
          operation.tags = ['default']
        }
      })
    })
  }

  return content
}
