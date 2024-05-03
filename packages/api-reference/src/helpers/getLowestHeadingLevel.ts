import type { Headings } from './getHeadingsFromMarkdown'

export type HeadingLevels = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Returns the lowest heading level from a list of headings.
 *
 * If there are h1, h2, h3 … h1 is the lowest heading level.
 */
export const getLowestHeadingLevel = (headings: Headings): HeadingLevels => {
  const lowestLevel = Math.min(...headings.map((heading) => heading.depth))

  if (lowestLevel >= 1 && lowestLevel <= 6) {
    return lowestLevel as HeadingLevels
  }

  return 1
}
