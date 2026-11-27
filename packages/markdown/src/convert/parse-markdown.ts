import type { Nodes, Root } from 'mdast'

import { BlockParser } from '../pipeline/blocks'

/**
 * Copies the parser's tree into plain mdast: without `position`, which nothing that converts
 * Markdown reads, and without the parser's own bookkeeping (`trailing` on breaks).
 *
 * Footnote identifiers are lower case, as `mdast-util-gfm-footnote` makes them. The parser keeps
 * them upper case, which is what CommonMark's case folding compares.
 */
const standard = (node: Record<string, unknown>): Nodes => {
  const copy: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    if (key === 'position' || key === 'trailing' || key === 'footnotes') continue
    copy[key] = key === 'children' ? (value as Record<string, unknown>[]).map(standard) : value
  }
  if (
    (node.type === 'footnoteReference' || node.type === 'footnoteDefinition') &&
    typeof node.identifier === 'string'
  ) {
    copy.identifier = node.identifier.toLowerCase()
  }
  return copy as unknown as Nodes
}

/**
 * Parses GitHub Flavored Markdown into an mdast tree, with the same parser that renders it.
 *
 * Reference-style links and images come back as `link` and `image` nodes, because the parser
 * resolves references while it reads them, so there are no `definition`, `linkReference` or
 * `imageReference` nodes. Footnotes keep their `footnoteReference` and `footnoteDefinition` nodes.
 */
export const parseMarkdown = (markdown: string): Root =>
  standard(new BlockParser({ mdast: true }).parse(markdown) as unknown as Record<string, unknown>) as Root
