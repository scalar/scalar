import type { Element as HastElement, ElementContent as HastElementContent, Root as HastRoot } from 'hast'
import { createLowlight } from 'lowlight'
import type { Heading, Root as MdastRoot, RootContent as MdastRootContent, Node, PhrasingContent } from 'mdast'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeFormat from 'rehype-format'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

import { standardLanguages } from '@/languages'
import { rehypeAlert } from '@/rehype-alert'
import { rehypeHighlight } from '@/rehype-highlight'

type Options = {
  transform?: (node: Node) => Node
  type?: string
}

export type { Node } from 'mdast'

/**
 * Type-guard to check if a node is a heading.
 */
export const isHeading = (node: Node): node is Heading => {
  return node.type === 'heading' && 'depth' in node && 'children' in node
}

/**
 * The transform for the render currently in flight.
 *
 * A `unified` processor is configured once, at `use()` time, but `transform`
 * arrives per call — so it is handed over here instead. `processSync` runs to
 * completion without yielding, so nothing can interleave; the save and restore
 * in `htmlFromMarkdown` only matter if a `transform` were itself to render
 * Markdown.
 */
let activeTransform: Options = {}

/**
 * Plugin to transform nodes in a Markdown AST
 */
const transformNodes = () => (tree: Node) => {
  const { transform, type } = activeTransform

  if (!transform || !type) {
    return
  }

  visit(tree, type, (node) => {
    transform(node)

    return SKIP
  })

  return
}

const TAGS_WITH_INLINE_MARKDOWN = new Set(['dd', 'dt', 'li', 'p', 'summary', 'td', 'th'])
const MAY_CONTAIN_INLINE_MARKDOWN = /[`*_\[~]/

/**
 * Preserve HTML-like text in inline markdown by turning mdast `html` nodes into text nodes.
 */
const preserveHtmlLikeText = () => (tree: MdastRoot) => {
  visit(tree, 'html', (node, index, parent) => {
    if (typeof index !== 'number' || !parent || !('children' in parent) || !Array.isArray(parent.children)) {
      return
    }

    parent.children[index] = {
      type: 'text',
      value: node.value ?? '',
    } as MdastRootContent
  })
}

const inlineMarkdownProcessor = unified().use(remarkParse).use(remarkGfm).use(preserveHtmlLikeText).use(remarkRehype)
const htmlFragmentParser = unified().use(rehypeParse, { fragment: true })
const htmlFragmentStringifier = unified().use(rehypeStringify)

/**
 * Parse inline markdown and return children from the generated paragraph.
 */
const extractInlineChildrenFromMarkdown = (value: string): HastElementContent[] => {
  const tree = inlineMarkdownProcessor.runSync(inlineMarkdownProcessor.parse(value)) as HastRoot

  if (tree.children.length !== 1) {
    return []
  }

  const paragraph = tree.children.at(0)
  if (!paragraph || paragraph.type !== 'element' || paragraph.tagName !== 'p') {
    return []
  }

  return paragraph.children
}

/**
 * Re-parses text nodes in selected HTML tags so inline markdown works in tags like <p>.
 */
const transformInlineMarkdownInHtml = () => (tree: HastRoot) => {
  visit(tree, 'element', (node: HastElement) => {
    if (!TAGS_WITH_INLINE_MARKDOWN.has(node.tagName)) {
      return
    }

    node.children = node.children.flatMap((child) => {
      if (child.type !== 'text' || !MAY_CONTAIN_INLINE_MARKDOWN.test(child.value)) {
        return [child]
      }

      const markdownChildren = extractInlineChildrenFromMarkdown(child.value)
      return markdownChildren.length ? markdownChildren : [child]
    })
  })
}

/**
 * Rewrites raw HTML strings so inline markdown parsing is only applied to raw HTML input.
 */
const transformInlineMarkdownInRawHtml = () => (tree: HastRoot) => {
  visit(tree, 'raw', (node) => {
    if (typeof node.value !== 'string' || !MAY_CONTAIN_INLINE_MARKDOWN.test(node.value)) {
      return
    }

    const htmlFragmentTree = htmlFragmentParser.parse(node.value) as HastRoot
    transformInlineMarkdownInHtml()(htmlFragmentTree)
    node.value = htmlFragmentStringifier.stringify(htmlFragmentTree)
  })
}

/**
 * One registry for every render.
 *
 * `rehypeHighlight` builds its own from `languages` when it is not given an
 * instance, and it does that at plugin-init — so a per-call processor meant a
 * fresh registry of every standard grammar on every single Markdown render.
 */
const lowlight = createLowlight(standardLanguages)

/** Processors, keyed by the tag allowlist they were built with. */
const processors = new Map<string, ReturnType<typeof buildProcessor>>()

/**
 * Rendered HTML, keyed by the Markdown and the tags it was rendered with.
 *
 * Only renders without a `transform` are cached. A `transform` is a closure
 * that can read state the key cannot see — `ScalarMarkdown`'s heading transform
 * reads `anchorPrefix` off props, so the same function and the same Markdown
 * can legitimately produce different ids.
 */
const rendered = new Map<string, string>()

/** Plenty for a page of descriptions, small enough to stay cheap. */
const CACHE_LIMIT = 200

const buildProcessor = (tagNames: string[]) =>
  unified()
    // Parses markdown
    .use(remarkParse)
    // Support autolink literals, footnotes, strikethrough, tables and tasklists
    .use(remarkGfm)
    .use(transformNodes)
    // Allows any HTML tags
    .use(remarkRehype, { allowDangerousHtml: true })
    // Adds GitHub alerts
    .use(rehypeAlert)
    // Parse inline markdown only inside raw HTML fragments, not normal markdown output
    .use(transformInlineMarkdownInRawHtml)
    // Creates an HTML AST
    .use(rehypeRaw)
    // Removes disallowed tags
    .use(rehypeSanitize, {
      ...defaultSchema,
      // Don't prefix the heading ids
      clobberPrefix: '',
      // Makes it even more strict
      tagNames,
      attributes: {
        ...defaultSchema.attributes,
        abbr: ['title'],
        // Allow all class names while preserving the existing default attributes
        '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className'],
      },
      // Strip content of dangerous elements, not just the tags
      strip: ['script', 'style', 'object', 'embed', 'form'],
    })
    // Syntax highlighting
    .use(rehypeHighlight, {
      lowlight,
      // Enable auto detection
      detect: true,
      // Adds Scalar's custom scrollbar styling to highlighted code blocks
      className: 'custom-scroll',
    })
    // Adds target="_blank" to external links
    .use(rehypeExternalLinks, { target: '_blank' })
    // Formats the HTML
    .use(rehypeFormat)
    // Converts the HTML AST to a string
    .use(rehypeStringify)
    .freeze()

/** Insert into a bounded cache, evicting the oldest entry once it is full. */
const remember = (cache: Map<string, string>, key: string, value: string) => {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value

    if (oldest !== undefined) {
      cache.delete(oldest)
    }
  }

  cache.set(key, value)
}

/**
 * Take a Markdown string and generate HTML from it
 */
export function htmlFromMarkdown(
  markdown: string,
  options?: {
    removeTags?: string[]
    allowTags?: string[]
    transform?: (node: Node) => Node
    transformType?: string
  },
) {
  // Add permitted tags and remove stripped ones
  const removeTags = options?.removeTags ?? []
  const tagNames = [...(defaultSchema.tagNames ?? []), ...(options?.allowTags ?? [])].filter(
    (t) => !removeTags.includes(t),
  )

  const tagKey = tagNames.join(',')
  const cacheKey = options?.transform ? undefined : `${tagKey}\u0000${markdown}`

  if (cacheKey !== undefined) {
    const hit = rendered.get(cacheKey)

    if (hit !== undefined) {
      return hit
    }
  }

  let processor = processors.get(tagKey)

  if (!processor) {
    processor = buildProcessor(tagNames)
    processors.set(tagKey, processor)
  }

  const previousTransform = activeTransform
  activeTransform = { transform: options?.transform, type: options?.transformType }

  let html: string

  try {
    html = processor.processSync(markdown).toString()
  } finally {
    activeTransform = previousTransform
  }

  if (cacheKey !== undefined) {
    remember(rendered, cacheKey, html)
  }

  return html
}

/**
 * Create a Markdown AST from a string.
 */
function getMarkdownAst(markdown: string): MdastRoot {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown)
}

/**
 * Find all headings of a specific type in a Markdown AST.
 */
export function getHeadings(
  markdown: string,
  depth: number = 1,
): {
  depth: number
  value: string
}[] {
  const tree = getMarkdownAst(markdown)

  const nodes: {
    depth: number
    value: string
  }[] = []

  visit(tree, 'heading', (node) => {
    const text = textFromNode(node)

    if (text) {
      nodes.push({ depth: node.depth ?? depth, value: text })
    }
  })

  return nodes
}

/**
 * Extract plain text from a Markdown AST node (recursively).
 *
 * Handles headings with nested phrasing content such as links.
 */
export function textFromNode(node: Heading | PhrasingContent): string {
  if (node.type === 'text') {
    return node.value ?? ''
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child) => textFromNode(child)).join('')
  }

  return ''
}

/**
 * Return multiple Markdown documents. Every heading should be its own document.
 */
export function splitContent(markdown: string) {
  const tree = getMarkdownAst(markdown)

  /** Sections */
  const sections: MdastRootContent[][] = []

  /** Nodes inside a section */
  let nodes: MdastRootContent[] = []

  tree.children?.forEach((node) => {
    // If the node is a heading, start a new section
    if (node.type === 'heading') {
      if (nodes.length) {
        sections.push(nodes)
      }

      sections.push([node])

      nodes = []
    }
    // Otherwise, add the node to the current section
    else {
      nodes.push(node)
    }
  })

  // Add any remaining nodes
  if (nodes.length) {
    sections.push(nodes)
  }

  return sections.map((section) => createDocument(section))
}

/**
 * Use remark to create a Markdown document from a list of nodes.
 */
function createDocument(nodes: MdastRootContent[]) {
  // Create the Markdown string
  const markdown = unified().use(remarkStringify).use(remarkGfm).stringify({
    type: 'root',
    children: nodes,
  })

  // Remove the whitespace
  return markdown.trim()
}
