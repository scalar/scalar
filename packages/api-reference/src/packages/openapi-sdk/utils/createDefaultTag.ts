import type { OpenAPI } from '@scalar/openapi-types'

export function createDefaultTag(content: OpenAPI.Document): OpenAPI.Document {
  const defaultTag: OpenAPI.TagObject = {
    name: 'default',
    description: 'Operations without tags',
  }

  // Check if there are any operations without tags
  const hasUntaggedOperations = Object.values(content.paths || {}).some(
    (pathItem) =>
      Object.values(pathItem || {}).some(
        (operation) =>
          typeof operation === 'object' &&
          (!operation.tags || operation.tags.length === 0),
      ),
  )

  if (hasUntaggedOperations) {
    // Add the default tag if it doesn't exist
    if (!content.tags) {
      content.tags = []
    }
    if (!content.tags.some((tag) => tag.name === 'default')) {
      content.tags.push(defaultTag)
    }

    // Assign the default tag to operations without tags
    Object.values(content.paths || {}).forEach((pathItem) => {
      Object.values(pathItem || {}).forEach((operation) => {
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
