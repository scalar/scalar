import type { TraversedDescription } from '@/features/traverse-schema/types'
import { getHeadingsFromMarkdown, getLowestHeadingLevel } from '@/libs/markdown'
import type { Heading } from '@scalar/types/legacy'

export const DEFAULT_INTRODUCTION_SLUG = 'introduction'

/**
 * Creates sidebar entries from markdown headings in the OpenAPI description.
 * Only includes the top two levels of headings for a clean hierarchy.
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
