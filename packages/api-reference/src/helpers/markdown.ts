import { getHeadings } from '@scalar/code-highlight/markdown'
import { slugger } from '@scalar/helpers/string/slugger'
import type { Heading } from '@scalar/types/legacy'

const withSlugs = (headings: Heading[], slug: (v: string) => string): Heading[] =>
  headings.map((heading) => {
    return {
      ...heading,
      slug: slug(heading.value),
    }
  })

/**
 * Extracts all headings from a Markdown string.
 */
export function getHeadingsFromMarkdown(input: string): Heading[] {
  const { slug } = slugger()

  const headings = getHeadings(input)

  return withSlugs(headings as Heading[], slug)
}
