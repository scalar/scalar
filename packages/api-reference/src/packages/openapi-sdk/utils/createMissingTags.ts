import type { OpenAPI } from '@scalar/openapi-types'

export function createMissingTags(content: OpenAPI.Document): OpenAPI.Document {
  // Initialize tags array if it doesn't exist
  if (!content.tags) {
    content.tags = []
  }

  // Create a set of existing tag names for faster lookup
  const existingTags = new Set(content.tags.map((tag) => tag.name))

  // Loop through all paths and operations
  Object.values(content.paths || {}).forEach((pathItem: OpenAPI.PathItem) => {
    Object.values(pathItem || {}).forEach((operation: OpenAPI.Operation) => {
      if (typeof operation === 'object' && operation.tags) {
        operation.tags.forEach((tagName) => {
          // If the tag doesn't exist, create it
          if (!existingTags.has(tagName)) {
            content.tags!.push({
              name: tagName,
              description: '', // You can set a default description if needed
            })
            existingTags.add(tagName)
          }
        })
      }
    })
  })

  // Handle webhooks if they exist
  if (content.webhooks) {
    Object.values(content.webhooks).forEach((webhook: OpenAPI.PathItem) => {
      Object.values(webhook).forEach((operation: OpenAPI.Operation) => {
        if (typeof operation === 'object' && operation.tags) {
          operation.tags.forEach((tagName) => {
            if (!existingTags.has(tagName)) {
              content.tags!.push({
                name: tagName,
                description: '',
              })
              existingTags.add(tagName)
            }
          })
        }
      })
    })
  }

  return content
}
