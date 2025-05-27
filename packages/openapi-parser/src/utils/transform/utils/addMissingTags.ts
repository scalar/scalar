import type { AnyObject } from '@/types/index'

export const addMissingTags = (definition: AnyObject) => {
  if (!definition.paths) {
    return definition
  }

  // Collect all unique tags used in operations
  const usedTags = new Set<string>()
  for (const path of Object.values(definition.paths)) {
    if (typeof path === 'object' && path !== null) {
      for (const operation of Object.values(path)) {
        if (typeof operation === 'object' && operation !== null && 'tags' in operation) {
          const tags = operation.tags

          if (Array.isArray(tags)) {
            tags.forEach((tag) => usedTags.add(String(tag)))
          }
        }
      }
    }
  }

  // Convert tags to array of tag objects if not already present
  const existingTags = new Set(
    (Array.isArray(definition.tags) ? definition.tags : [])
      .map((tag) => (typeof tag === 'object' && tag !== null ? String(tag.name) : null))
      .filter(Boolean),
  )

  // Add missing tags
  const missingTags = [...usedTags].filter((tag) => !existingTags.has(tag)).map((name) => ({ name }))

  return {
    ...definition,
    tags: [...(Array.isArray(definition.tags) ? definition.tags : []), ...missingTags],
  }
}
