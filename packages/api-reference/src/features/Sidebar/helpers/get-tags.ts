import type { TagSortOption } from '@/features/Sidebar/types'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

// TODO: The store should support those custom properties
type ExtendedTagObject = OpenAPIV3_1.TagObject & {
  'x-internal'?: boolean
  'x-scalar-ignore'?: boolean
  'x-displayName'?: string
  operations?: any[]
}

/**
 * Takes an OpenAPI Document and returns an array of tags.
 */
export function getTags(content: OpenAPIV3_1.Document, { sort, filter }: TagSortOption = {}): ExtendedTagObject[] {
  // Start with top-level tags
  let tags = (content.tags ?? []) as ExtendedTagObject[]

  // Collect tags from paths if they exist
  if (content.paths) {
    const pathTags = new Set<string>()
    let hasUntaggedOperations = false
    let hasTaggedOperations = false

    // Loop through all paths and operations to collect unique tags
    Object.values(content.paths).forEach((pathItem) => {
      if (!pathItem) {
        return
      }

      Object.values(pathItem).forEach((operation) => {
        if (typeof operation === 'object') {
          if (operation?.tags?.length) {
            operation.tags.forEach((tag: string) => pathTags.add(tag))
            hasTaggedOperations = true
          } else {
            hasUntaggedOperations = true
          }
        }
      })
    })

    // Add any tags from paths that aren't already in the top-level tags
    pathTags.forEach((tagName) => {
      if (!tags.some((t) => t.name === tagName)) {
        tags.push({ name: tagName })
      }
    })

    // Only add default tag if we have both tagged and untagged operations
    if (hasTaggedOperations && hasUntaggedOperations && !tags.some((t) => t.name === 'default')) {
      tags.push({ name: 'default' })
    }
  }

  if (filter) {
    tags = tags.filter(filter)
  }

  if (sort === 'alpha') {
    return tags.sort((a, b) => {
      // Handle undefined names by putting them at the end
      if (!a.name && !b.name) {
        return 0
      }

      if (!a.name) {
        return 1
      }

      if (!b.name) {
        return -1
      }

      const nameA = a['x-displayName'] ?? a.name
      const nameB = b['x-displayName'] ?? b.name

      return nameA.localeCompare(nameB)
    })
  }

  if (typeof sort === 'function') {
    return tags.sort(sort)
  }

  return tags
}
