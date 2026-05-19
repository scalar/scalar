import { getHeadingsFromMarkdown, getLowestHeadingLevel } from '@/navigation/helpers/utils'
import type { TraverseSpecOptions } from '@/navigation/types'
import type { TraversedDescription } from '@/schemas/navigation'
import type { InfoObject } from '@/schemas/v3.1/strict/info'

const DEFAULT_DESCRIPTION_ENTRY = {
  TITLE: 'Introduction',
  SLUG: 'introduction',
} as const

const getDefaultDescriptionEntry = (
  generateId: TraverseSpecOptions['generateId'],
  parentId: string,
  info: InfoObject,
) => {
  const id = generateId({
    type: 'text',
    depth: 1,
    slug: DEFAULT_DESCRIPTION_ENTRY.SLUG,
    parentId: parentId,
    info,
    value: DEFAULT_DESCRIPTION_ENTRY.TITLE,
  })

  const entry = {
    id,
    title: DEFAULT_DESCRIPTION_ENTRY.TITLE,
    type: 'text',
  } satisfies TraversedDescription

  return entry
}

/**
 * Creates a hierarchical navigation structure from markdown headings in an OpenAPI description.
 *
 * The function processes markdown headings to create a two-level navigation tree:
 * - Level 1: Main sections (based on the lowest heading level found)
 * - Level 2: Subsections (one level deeper than the main sections)
 *
 * If the description starts with content rather than a heading, an "Introduction" section
 * is automatically added as the first entry.
 *
 * @param description - The markdown description text to process
 * @param generateId - Function to generate unique IDs for headings
 * @param parentId - The ID of the parent entry
 * @param info - OpenAPI Info Object
 *
 * @returns Array of TraversedDescription entries with their hierarchy
 */
export const traverseDescription = ({
  generateId,
  parentId,
  info,
}: {
  generateId: TraverseSpecOptions['generateId']
  parentId: string
  info: InfoObject
}): TraversedDescription[] => {
  const description = info.description?.trim()

  if (!description) {
    // Return a single entry for the introduction section
    return [getDefaultDescriptionEntry(generateId, parentId, info)]
  }

  const headings = getHeadingsFromMarkdown(description)
  const lowestLevel = getLowestHeadingLevel(headings)

  const entries: TraversedDescription[] = []

  let descriptionHeadingsEntry: TraversedDescription | null = null
  let currentParent: TraversedDescription | null = null

  // Add "Introduction" as the first heading
  if (!description.startsWith('#')) {
    const entry = getDefaultDescriptionEntry(generateId, parentId, info)
    entries.push(entry)
    descriptionHeadingsEntry = entry
  }

  // Go through each heading
  for (const heading of headings) {
    // Skip if not a main or sub heading
    if (heading.depth !== lowestLevel && heading.depth !== lowestLevel + 1) {
      continue
    }

    const entry: TraversedDescription = {
      id: generateId({
        type: 'text',
        depth: heading.depth,
        slug: heading.slug,
        parentId: parentId,
        info: info,
        value: heading.value,
      }),
      title: heading.value,
      type: 'text',
    }

    if (heading.depth === lowestLevel) {
      entry.children = []

      // Add to description headings to the 'Introduction' entry
      if (descriptionHeadingsEntry) {
        if (!descriptionHeadingsEntry.children) {
          descriptionHeadingsEntry.children = []
        }
        descriptionHeadingsEntry.children.push(entry)
      }
      // If no 'Introduction' entry, add to entries
      else {
        entries.push(entry)
      }

      currentParent = entry
    } else if (currentParent) {
      currentParent.children?.push(entry)
    }
  }

  return entries
}
