import type { SidebarEntry } from '@/features/Sidebar/types'
import { getHeadingsFromMarkdown, getLowestHeadingLevel } from '@/libs/markdown'
import type { Heading } from '@scalar/types/legacy'

/**
 * Creates sidebar entries from markdown headings in the OpenAPI description.
 * Only includes the top two levels of headings for a clean hierarchy.
 */
export const traverseDescription = (
  description: string | undefined,
  getHeadingId: (heading: Heading) => string,
): SidebarEntry[] => {
  if (!description?.trim()) {
    return []
  }

  const headings = getHeadingsFromMarkdown(description)
  const lowestLevel = getLowestHeadingLevel(headings)

  const entries: SidebarEntry[] = []
  let currentParent: SidebarEntry | null = null

  for (const heading of headings) {
    if (heading.depth !== lowestLevel && heading.depth !== lowestLevel + 1) {
      continue
    }

    const entry: SidebarEntry = {
      id: getHeadingId(heading),
      title: heading.value,
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
