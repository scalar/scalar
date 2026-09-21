import type { Element } from 'hast'
import rehypeFormat from 'rehype-format'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

import { getHighlightLanguage, rehypeHighlight } from '../rehype-highlight/rehype-highlight'
import { loadLanguages } from './languages'

/** Highlight already-sanitized Markdown HTML without loading unused grammars. */
export const highlightMarkdown = async (html: string): Promise<string> => {
  const parser = unified().use(rehypeParse, { fragment: true })
  const tree = parser.parse(html)
  const languages = new Set<string>()
  visit(tree, 'element', (node: Element, _, parent) => {
    if (node.tagName !== 'code' || parent?.type !== 'element' || parent.tagName !== 'pre') {
      return
    }
    const language = getHighlightLanguage(node)
    if (language === 'no-highlight') {
      return
    }
    languages.add(language)
  })
  if (!languages.size) {
    return html
  }
  const grammars = await loadLanguages([...languages])
  const processor = parser()
    .use(rehypeHighlight, { languages: grammars, detect: true, className: 'custom-scroll' })
    .use(rehypeFormat)
    .use(rehypeStringify)
  return (await processor.process(html)).toString()
}
