import type { OpenAPI } from '@scalar/openapi-types'

/**
 * Make sure the OpenAPI document has tags and paths, even if they are empty.
 */
export function addRequiredProperties(content: OpenAPI.Document) {
  const updatedContent = { ...content }

  if (!updatedContent.paths) {
    updatedContent.paths = {}
  }

  if (!updatedContent.tags) {
    updatedContent.tags = []
  }

  return updatedContent
}
