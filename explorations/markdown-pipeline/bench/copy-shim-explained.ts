/**
 * The old converters with the intended changes applied (`copy-explain.mjs`) and the current
 * upstream serializer. Where a document's new output equals this side's, every difference in it
 * is one of the intended changes.
 */
import type { Root } from 'mdast'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { type Options, toMarkdown } from 'mdast-util-to-markdown-latest'

import { htmlFromMarkdown } from '../../../packages/markdown/src/markdown/index'
import { mdastFromHtml, parseMarkdown as parseOld } from './copy-baseline'
// @ts-expect-error: a plain JavaScript module of the harness.
import { explain } from './copy-explain.mjs'

export { htmlFromMarkdown, mdastFromHtml }
export const parseMarkdown = (markdown: string): Root => {
  const tree = parseOld(markdown)
  return { ...tree, children: explain(tree.children) }
}
export const createMarkdownSerializer =
  (options?: Options): ((tree: Root) => string) =>
  (tree) =>
    toMarkdown(tree, { ...options, extensions: [gfmToMarkdown()] })
