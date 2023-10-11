import remarkHeadings from '@vcarl/remark-headings'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'

const processor = unified()
  .use(remarkParse)
  .use(remarkStringify)
  .use(remarkHeadings)

export type Headings = {
  depth: number
  value: string
}[]

export const getHeadingsFromMarkdown = async (
  input: string,
): Promise<Headings> => {
  return (await processor.process(input)).data.headings as Headings
}
