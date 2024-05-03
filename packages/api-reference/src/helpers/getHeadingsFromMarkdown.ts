import type { Heading } from '@scalar/oas-utils'
import remarkHeadings from '@vcarl/remark-headings'
import GithubSlugger from 'github-slugger'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'

export type Headings = Heading[]

const processor = unified()
  .use(remarkParse)
  .use(remarkStringify)
  .use(remarkHeadings)

export const getHeadingsFromMarkdown = async (
  input: string,
): Promise<Headings> => {
  const slugger = new GithubSlugger()

  const { headings } = (await processor.process(input)).data

  return withSlugs(headings as Headings, slugger)
}

const withSlugs = (headings: Headings, slugger: GithubSlugger): Headings =>
  headings.map((heading) => {
    return {
      ...heading,
      slug: slugger.slug(heading.value),
    }
  })
