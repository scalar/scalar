import { getHeadings } from '@scalar/code-highlight/markdown'
import GithubSlugger from 'github-slugger'

import type { Heading } from '@/navigation/types'

/**
 * Adds URL-friendly slugs to each heading in the array.
 * Uses GithubSlugger to generate consistent slugs that match GitHub's heading anchor format.
 *
 * @param headings - Array of heading objects containing value and depth
 * @param slugger - GithubSlugger instance for generating consistent slugs
 * @returns Array of headings with added slug property
 *
 * @example
 * const headings = [
 *   { value: 'Getting Started', depth: 1 },
 *   { value: 'Installation', depth: 2 }
 * ]
 * const slugger = new GithubSlugger()
 * withSlugs(headings, slugger)
 * // Returns:
 * // [
 * //   { value: 'Getting Started', depth: 1, slug: 'getting-started' },
 * //   { value: 'Installation', depth: 2, slug: 'installation' }
 * // ]
 */
const withSlugs = (headings: Heading[], slugger: GithubSlugger): Heading[] =>
  headings.map((heading) => {
    return {
      ...heading,
      slug: slugger.slug(heading.value),
    }
  })

/**
 * Extracts all headings from a Markdown string and adds URL-friendly slugs to each heading.
 * Uses GithubSlugger to generate consistent slugs that match GitHub's heading anchor format.
 *
 * @param input - The Markdown string to extract headings from
 * @returns Array of heading objects containing value, depth, and slug
 *
 * @example
 * const markdown = `
 * # Getting Started
 * ## Installation
 * ### Requirements
 * `
 * const headings = getHeadingsFromMarkdown(markdown)
 * // Returns:
 * // [
 * //   { value: 'Getting Started', depth: 1, slug: 'getting-started' },
 * //   { value: 'Installation', depth: 2, slug: 'installation' },
 * //   { value: 'Requirements', depth: 3, slug: 'requirements' }
 * // ]
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
 * @param headings - Array of heading objects containing depth property
 * @returns The lowest heading level (1-6) or 1 if no valid headings found
 *
 * @example
 * const headings = [
 *   { value: 'Getting Started', depth: 1 },
 *   { value: 'Installation', depth: 2 }
 * ]
 * getLowestHeadingLevel(headings) // Returns: 1
 */
export const getLowestHeadingLevel = (headings: Heading[]): HeadingLevels => {
  const lowestLevel = Math.min(...headings.map((heading) => heading.depth))

  if (lowestLevel >= 1 && lowestLevel <= 6) {
    return lowestLevel as HeadingLevels
  }

  return 1
}
