import type { Heading } from '@scalar/oas-utils'
import GithubSlugger from 'github-slugger'

const withSlugs = (headings: Heading[], slugger: GithubSlugger): Heading[] =>
  headings.map((heading) => {
    return {
      ...heading,
      slug: slugger.slug(heading.value),
    }
  })

export function getHeadingsFromMarkdown(input: string): Heading[] {
  const slugger = new GithubSlugger()

  const regex = new RegExp('^(#{1,6}) (?!#)(.*)', 'gm')
  const headings = [...input.matchAll(regex)].map((r) => ({
    value: r[2],
    depth: r[1].length,
  }))

  return withSlugs(headings as Heading[], slugger)
}
