import { getHeadings } from '@scalar/code-highlight/markdown'
import type { Heading } from '@scalar/types/legacy'
import GithubSlugger from 'github-slugger'

const withSlugs = (headings: Heading[], slugger: GithubSlugger): Heading[] =>
  headings.map((heading) => {
    return {
      ...heading,
      slug: slugger.slug(heading.value),
    }
  })

/**
 * Extracts all headings from a Markdown string.
 */
export function getHeadingsFromMarkdown(input: string): Heading[] {
  const slugger = new GithubSlugger()

  const headings = getHeadings(input)

  return withSlugs(headings as Heading[], slugger)
}

export type HeadingLevels = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Returns the lowest heading level from a list of headings.
 *
 * If there are h1, h2, h3 … h1 is the lowest heading level.
 */
export const getLowestHeadingLevel = (headings: Heading[]): HeadingLevels => {
  const lowestLevel = Math.min(...headings.map((heading) => heading.depth))

  if (lowestLevel >= 1 && lowestLevel <= 6) {
    return lowestLevel as HeadingLevels
  }

  return 1
}
