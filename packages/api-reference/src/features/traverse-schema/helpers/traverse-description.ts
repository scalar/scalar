import type { TraversedDescription } from '@/features/traverse-schema/types'
import { getHeadingsFromMarkdown } from '@/libs/markdown'
import type { Heading } from '@scalar/types/legacy'

export const DEFAULT_INTRODUCTION_SLUG = 'introduction'

/** Parses & traverses markdown description headings, and returns an organized object based on their depths. */
export const traverseDescription = (
  description: string | undefined,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getHeadingId: (heading: Heading) => string,
): TraversedDescription[] => {
  // If we don't have a description skip traversal
  if (!description?.trim()) {
    return []
  }

  // Gets all headings and their depths from the markdown description. Ordered by depth low to high.
  const headings = getHeadingsFromMarkdown(description)

  // Always insert the "Introduction" heading as the first heading
  headings.splice(0, 0, {
    depth: 1,
    value: 'Introduction',
    slug: DEFAULT_INTRODUCTION_SLUG,
  })

  // Setup a root element of depth 0 to push all headings into
  const root = { type: 'description', children: [], depth: 0, title: 'root', id: 'root' } satisfies TraversedDescription
  // Create a stack, used to track visited headings during traversal
  const stack: TraversedDescription[] = [root]

  headings.forEach((heading) => {
    // Get the last item in the stack
    let parent = stack.at(-1)

    // Find the most immediate parent for the current heading
    const parentIndex = stack.findLastIndex((item) => item.depth < heading.depth)
    parent = stack[parentIndex]

    // Remove all trailing elements after the parentIndex from the stack
    stack.splice(parentIndex + 1)

    // Prepare the next heading
    const headingItem: TraversedDescription = {
      type: 'description',
      children: [],
      depth: heading.depth,
      id: getHeadingId(heading),
      title: heading.value,
    }

    // Update the tiles map, used for the mobile heading.
    titlesMap.set(headingItem.id, headingItem.title)

    // If we found a suitable parent, insert the heading.
    parent?.children?.push(headingItem)

    // Update the stack with the new heading
    stack.push(headingItem)
  })

  return root.children
}
