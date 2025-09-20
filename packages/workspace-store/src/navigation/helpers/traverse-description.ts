import { getHeadingsFromMarkdown, getLowestHeadingLevel } from '@/navigation/helpers/utils'
import type { Heading } from '@/navigation/types'
import type { TraversedDescription } from '@/schemas/v3.1/strict/openapi-document'

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
 * @param entitiesMap - Map to store heading IDs and titles for mobile header navigation
 * @param getHeadingId - Function to generate unique IDs for headings
 * @returns Array of navigation entries with their hierarchy
 */
export const traverseDescription = (
  description: string | undefined,
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

    const entry = {
      id,
      title,
      type: 'text',
    } satisfies TraversedDescription

    // Push to entries
    entries.push(entry)
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
