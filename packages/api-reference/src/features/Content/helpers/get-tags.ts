import type { OpenAPIV3_1 } from '@scalar/openapi-types'

// TODO: The store should support those custom properties
type ExtendedTagObject = OpenAPIV3_1.TagObject & {
  'x-internal'?: boolean
  'x-scalar-ignore'?: boolean
  'x-displayName'?: string
  operations?: any[]
}

// TODO: The store should support those custom properties
type TagGroup = {
  name: string
  tags: string[]
}

// TODO: The store should support those custom properties
type ExtendedDocument = OpenAPIV3_1.Document & {
  'x-tagGroups'?: TagGroup[]
}

export type TagSortOption = {
  sort?: 'alpha' | ((a: ExtendedTagObject, b: ExtendedTagObject) => number)
}

/**
 * Takes an OpenAPI Document and returns an array of tags.
 */
export function getTags(content: ExtendedDocument, { sort }: TagSortOption = {}): ExtendedTagObject[] {
  let tags = (content.tags ?? []) as ExtendedTagObject[]

  // Filter out internal tags unless explicitly included
  tags = tags.filter((tag) => !tag['x-internal'])

  // Filter out ignored tags unless explicitly included
  tags = tags.filter((tag) => !tag['x-scalar-ignore'])

  // Handle tag groups if present
  if (content['x-tagGroups']) {
    // Create a map of tags by name for quick lookup
    const tagMap = new Map(tags.map((tag) => [tag.name, tag]))

    // Process tag groups and flatten back to array
    tags = content['x-tagGroups'].flatMap((group) =>
      group.tags.map((tagName) => tagMap.get(tagName)).filter((tag): tag is ExtendedTagObject => tag !== undefined),
    )
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
