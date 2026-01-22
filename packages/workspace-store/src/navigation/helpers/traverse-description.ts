import { getHeadingsFromMarkdown, getLowestHeadingLevel } from '@/navigation/helpers/utils'
import type { TraverseSpecOptions } from '@/navigation/types'
import type { TraversedDescription, TraversedEntry } from '@/schemas/navigation'
import type { InfoObject } from '@/schemas/v3.1/strict/info'

/**
 * Creates a hierarchical navigation structure from markdown headings in an OpenAPI description.
 *
 * The function processes markdown headings to create a two-level navigation tree:
 * - Level 1: Main sections (based on the lowest heading level found)
 * - Level 2: Subsections (one level deeper than the main sections)
 *
 * If the description starts with a heading, the headings are returned directly.
 * If the description starts with content rather than a heading, an "Introduction" folder
 * is created that contains all markdown headings as children.
 *
 * @param description - The markdown description text to process
 * @param entitiesMap - Map to store heading IDs and titles for mobile header navigation
 * @param getHeadingId - Function to generate unique IDs for headings
 * @returns Array of description entries (either headings directly, or a single "Introduction" folder)
 */
export const traverseDescription = ({
  generateId,
  parentId,
  info,
}: {
  generateId: TraverseSpecOptions['generateId']
  parentId: string
  info: InfoObject
}): TraversedEntry[] => {
  if (!info.description?.trim()) {
    return []
  }

  const headings = getHeadingsFromMarkdown(info.description)
  const lowestLevel = getLowestHeadingLevel(headings)
  const descriptionStartsWithHeading = info.description.trim().startsWith('#')

  const children: TraversedDescription[] = []
  let currentParent: TraversedDescription | null = null

  // Traverse all markdown headings
  for (const heading of headings) {
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
      children.push(entry)
      currentParent = entry
    } else if (currentParent) {
      currentParent.children?.push(entry)
    }
  }

  // If description starts with a heading, return headings directly without Introduction folder
  if (descriptionStartsWithHeading) {
    return children
  }

  // If description doesn't start with a heading, create Introduction folder
  const introductionTitle = 'Introduction'

  // Generate ID for the Introduction folder
  const introductionId = generateId({
    type: 'text',
    depth: 1,
    slug: 'introduction',
    parentId: parentId,
    info: info,
    value: introductionTitle,
  })

  // Create description entry (folder) with all markdown entries as children
  // Always set children as an array (even if empty) so the folder is recognized as collapsible
  const introductionEntry: TraversedDescription = {
    id: introductionId,
    title: introductionTitle,
    type: 'text',
    children: children,
  }

  return [introductionEntry]
}
