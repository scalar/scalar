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
