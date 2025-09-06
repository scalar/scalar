import type { TraversedDescription } from '@/features/traverse-schema/types'
import { getHeadingsFromMarkdown } from '@/libs/markdown'
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

  headings.splice(0, 0, {
    depth: 1,
    value: 'Introduction',
    slug: DEFAULT_INTRODUCTION_SLUG,
  })

  const root = { type: 'description', children: [], depth: 0, title: 'root', id: 'root' } satisfies TraversedDescription
  const stack: TraversedDescription[] = [root]

  headings.forEach((heading) => {
    let stackHead = stack.at(-1)

    const parentIndex = stack.findLastIndex((item) => item.depth < heading.depth)
    stackHead = stack[parentIndex]
    stack.splice(parentIndex + 1)

    const sidebarItem: TraversedDescription = {
      type: 'description',
      children: [],
      depth: heading.depth,
      id: getHeadingId(heading),
      title: heading.value,
    }

    titlesMap.set(sidebarItem.id, sidebarItem.title)
    stackHead?.children?.push(sidebarItem)
    stack.push(sidebarItem)
  })

  return root.children
}
