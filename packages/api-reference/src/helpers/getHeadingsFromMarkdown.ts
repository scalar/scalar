import { getMarkdownAst, getNodesOfType } from '@scalar/code-highlight/markdown'
import type { Heading } from '@scalar/oas-utils'
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

  const ast = getMarkdownAst(input)
  const headings = getNodesOfType(ast, 'heading')

  return withSlugs(headings as Heading[], slugger)
}
