import type { Heading, PhrasingContent, Root, RootContent, Text } from 'mdast'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeFormat from 'rehype-format'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import type { Node } from 'unist'
import { SKIP, visit } from 'unist-util-visit'

import { standardLanguages } from '@/languages'
import { rehypeAlert } from '@/rehype-alert'
import { rehypeHighlight } from '@/rehype-highlight'
type Options = {
  transform?: (node: Record<string, any>) => Record<string, any>
  type?: string
}

/**
 * Plugin to transform nodes in a Markdown AST
 */
const transformNodes =
  (options?: Readonly<Options> | null | undefined, ..._ignored: any[]) =>
  (tree: Node) => {
    if (!options?.transform || !options?.type) {
      return
    }

    visit(tree, options?.type, (node) => {
      options?.transform ? options?.transform(node) : node

      return SKIP
    })

    return
  }

/**
 * Take a Markdown string and generate HTML from it
 */
export function htmlFromMarkdown(
  markdown: string,
  options?: {
    removeTags?: string[]
    allowTags?: string[]
    transform?: (node: Record<string, any>) => Record<string, any>
    transformType?: string
  },
) {
  // Add permitted tags and remove stripped ones
  const removeTags = options?.removeTags ?? []
  const tagNames = [...(defaultSchema.tagNames ?? []), ...(options?.allowTags ?? [])].filter(
    (t) => !removeTags.includes(t),
  )

  const html = unified()
    // Parses markdown
    .use(remarkParse)
    // Support autolink literals, footnotes, strikethrough, tables and tasklists
    .use(remarkGfm)
    .use(transformNodes, {
      transform: options?.transform,
      type: options?.transformType,
    })
    // Allows any HTML tags
    .use(remarkRehype, { allowDangerousHtml: true })
    // Adds GitHub alerts
    .use(rehypeAlert)
    // Creates a HTML AST
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
        // Allow alert classes
        div: ['class', ['className', /^markdown-alert(-.*)?$/]],
      },
    })
    // Syntax highlighting
    .use(rehypeHighlight, {
      languages: standardLanguages,
      // Enable auto detection
      detect: true,
    })
    // Adds target="_blank" to external links
    .use(rehypeExternalLinks, { target: '_blank' })
    // Formats the HTML
    .use(rehypeFormat)
    // Converts the HTML AST to a string
    .use(rehypeStringify)
    // Run the pipeline
    .processSync(markdown)

  return html.toString()
}

/**
 * Create a Markdown AST from a string.
 */
function getMarkdownAst(markdown: string): Root {
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
    const text = findTextInHeading(node)

    if (text) {
      nodes.push({ depth: node.depth ?? depth, value: text.value })
    }
  })

  return nodes
}

/**
 * Find the text in a Markdown node (recursively).
 */
function findTextInHeading(node: Heading | PhrasingContent): Text | null {
  if (node.type === 'text') {
    return node as Text
  }

  if ('children' in node && node.children) {
    for (const child of node.children) {
      const text = findTextInHeading(child)

      if (text) {
        return text
      }
    }
  }

  return null
}

/**
 * Return multiple Markdown documents. Every heading should be its own document.
 */
export function splitContent(markdown: string) {
  const tree = getMarkdownAst(markdown)

  /** Sections */
  const sections: RootContent[][] = []

  /** Nodes inside a section */
  let nodes: RootContent[] = []

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
function createDocument(nodes: RootContent[]) {
  // Create the Markdown string
  const markdown = unified().use(remarkStringify).use(remarkGfm).stringify({
    type: 'root',
    children: nodes,
  })

  // Remove the whitespace
  return markdown.trim()
}
