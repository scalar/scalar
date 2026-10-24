/**
 * Prototype replacement for the unified/remark/rehype pipeline, with the same
 * public API as `@scalar/code-highlight/markdown`.
 */
import { type Block, BlockParser, type Root } from './blocks'
import { DEFAULT_TAGS } from './html'
import { type Inline, InlineParser } from './inline'
import { type Highlighter, render } from './render'

export type Node = Block | Inline | Root | { type: string; children?: Node[]; data?: unknown }
export type Heading = Block & { type: 'heading' }

export type HtmlFromMarkdownOptions = {
  removeTags?: string[]
  allowTags?: string[]
  transform?: (node: Node) => Node
  transformType?: string
  highlight?: Highlighter
  /** Test only. */
  unsafe?: boolean
}

export const isHeading = (node: Node): node is Heading =>
  node.type === 'heading' && 'depth' in node && 'children' in node

export const parse = (markdown: string): Root => new BlockParser().parse(markdown)

/** Visits nodes of `type`, not descending into a match, like `unist-util-visit` with `SKIP`. */
const visit = (node: Node, type: string, fn: (node: Node) => void): void => {
  if (node.type === type) return fn(node)
  const children = (node as { children?: Node[] }).children
  if (children) for (const child of children) visit(child, type, fn)
}

const tagCache = new Map<string, Set<string>>()

/** Same fast path as today: a single plain line needs no parsing at all. */
const PLAIN_PARAGRAPH =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Control characters are intentionally matched to validate or sanitize input.
  /^(?![-+=]|\d{1,9}[.)](?:\s|$))(?!.*(?: {2}|:\/|www\.|mailto:|xmpp:))[^\s\\`*_\[\]<>&#~|@\x00-\x1f\x7f\u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff](?:[^\\`*_\[\]<>&#~|@\t\n\v\f\r\x00-\x1f\x7f\u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff]*[^\s\\`*_\[\]<>&#~|@\x00-\x1f\x7f\u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff])?$/i

export const htmlFromMarkdown = (markdown: string, options?: HtmlFromMarkdownOptions): string => {
  const removeTags = options?.removeTags ?? []
  const allowTags = options?.allowTags ?? []
  if (!options?.transform && !removeTags.includes('p') && PLAIN_PARAGRAPH.test(markdown)) return `<p>${markdown}</p>`

  const key = `${removeTags.join(',')}|${allowTags.join(',')}`
  let tags = tagCache.get(key)
  if (!tags) {
    tags = new Set([...DEFAULT_TAGS, ...allowTags].filter((t) => !removeTags.includes(t)))
    tagCache.set(key, tags)
  }

  const parser = new BlockParser()
  const root = parser.parse(markdown)
  const { transform, transformType } = options ?? {}
  if (transform && transformType) visit(root, transformType, transform)
  return render(root, { tags, highlight: options?.highlight, inlineInHtml, unsafe: options?.unsafe })
}

/**
 * Markdown inside raw HTML tags such as `<p>`, as the current pipeline treats it: the text is a
 * document of its own (its own references, raw HTML as text), and only a single paragraph
 * counts. The whitespace around it is kept, where the current pipeline trims it away.
 */
const inlineInHtml = (text: string): Inline[] | null => {
  const root = new BlockParser({ htmlAsText: true }).parse(text)
  const only = root.children[0]
  if (root.children.length !== 1 || only?.type !== 'paragraph') return null
  const lead = /^[ \t\r\n]*/.exec(text)![0]
  const trail = /[ \t\r\n]*$/.exec(text)![0]
  return [
    ...(lead ? [{ type: 'text' as const, value: lead }] : []),
    ...only.children,
    ...(trail && trail !== text ? [{ type: 'text' as const, value: trail }] : []),
  ]
}

export const textFromNode = (node: Node): string => {
  if (node.type === 'text') return ((node as { value: string }).value ?? '').replace(/￿/g, '&')
  const children = (node as { children?: Node[] }).children
  return Array.isArray(children) ? children.map(textFromNode).join('') : ''
}

export const getHeadings = (markdown: string, depth = 1): { depth: number; value: string }[] => {
  const nodes: { depth: number; value: string }[] = []
  visit(parse(markdown), 'heading', (node) => {
    const value = textFromNode(node)
    if (value) nodes.push({ depth: (node as Heading).depth ?? depth, value })
  })
  return nodes
}

/**
 * Splits a document into one section per top-level heading. Slices the
 * source by line instead of re-serializing an AST, so no Markdown stringifier
 * is needed and every section keeps its original text.
 */
export const splitContent = (markdown: string): string[] => {
  const lines = markdown.split(/\r\n|\r|\n/)
  const sections: string[] = []
  let cursor = 1
  const push = (from: number, to: number): void => {
    const chunk = lines
      .slice(from - 1, to)
      .join('\n')
      .trim()
    if (chunk) sections.push(chunk)
  }
  for (const node of parse(markdown).children) {
    if (node.type !== 'heading') continue
    push(cursor, node.position.start.line - 1)
    push(node.position.start.line, node.position.end.line)
    cursor = node.position.end.line + 1
  }
  push(cursor, lines.length)
  return sections
}
