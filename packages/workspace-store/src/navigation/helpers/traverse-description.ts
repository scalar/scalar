import { getHeadingsFromMarkdown, getLowestHeadingLevel } from '@/navigation/helpers/utils'
import type { Heading } from '@/navigation/types'
import type { TraversedDescription } from '@/schemas/navigation'

export const DEFAULT_INTRODUCTION_SLUG = 'introduction'

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
 * @param titlesMap - Map to store heading IDs and titles for mobile header navigation
 * @param getHeadingId - Function to generate unique IDs for headings
 * @returns Array of navigation entries with their hierarchy
 */
export const traverseDescription = (
  description: string | undefined,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getHeadingId: (heading: Heading) => string,
): TraversedDescription[] => {
  if (!description?.trim()) {
    return []
  }

  const headings = getHeadingsFromMarkdown(description)
  const lowestLevel = getLowestHeadingLevel(headings)

  const entries: TraversedDescription[] = []
  let currentParent: TraversedDescription | null = null

  // Add "Introduction" as the first heading
  if (description && !description.trim().startsWith('#')) {
    const heading: Heading = {
      depth: 1,
      value: 'Introduction',
      slug: DEFAULT_INTRODUCTION_SLUG,
    }

    const id = getHeadingId(heading)
    const title = heading.value

    entries.push({
      id,
      title,
      type: 'text',
    })
    titlesMap.set(id, title)
  }

  // Traverse for the rest
  for (const heading of headings) {
    if (heading.depth !== lowestLevel && heading.depth !== lowestLevel + 1) {
      continue
    }

    const entry: TraversedDescription = {
      id: getHeadingId(heading),
      title: heading.value,
      type: 'text',
    }
    titlesMap.set(entry.id, entry.title)

    if (heading.depth === lowestLevel) {
      entry.children = []
      entries.push(entry)
      currentParent = entry
    } else if (currentParent) {
      currentParent.children?.push(entry)
    }
  }

  return entries
}
