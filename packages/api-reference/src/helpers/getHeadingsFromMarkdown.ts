import { findMarkdownHeadings } from '@scalar/use-markdown'
import GithubSlugger from 'github-slugger'

export type Heading = {
  depth: number
  value: string
  slug?: string
}
export type Headings = Heading[]

const slugger = new GithubSlugger()

export const getHeadingsFromMarkdown = async (input: string) => {
  const headings = await findMarkdownHeadings(input)

  return headings.map((h) => ({
    ...h,
    slug: slugger.slug(h.value),
  }))
}
