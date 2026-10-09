import { htmlFromMarkdown } from '@scalar/code-highlight'
import type { Root } from 'mdast'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import { unified } from 'unified'

const converter = unified().use(rehypeParse, { fragment: true }).use(rehypeSanitize).use(rehypeRemark).freeze()

/** Compatibility path loaded only for descriptions containing HTML or Scalar alerts. */
export const parseHtmlDescription = (value: string): Root => {
  const html = htmlFromMarkdown(value, { removeTags: ['img', 'picture'] })
  return converter.runSync(converter.parse(html))
}
