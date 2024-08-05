import { standardLanguages } from '@/languages'
import { rehypeHighlight } from '@/rehype-highlight'
import type { Root } from 'hast'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeFormat from 'rehype-format'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

type Options = {
  transform?: (node: Record<string, any>) => Record<string, any>
  type?: string
}

const transformNodes = function (
  options?: Readonly<Options> | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._ignored: any[]
) {
  return (tree: Root) => {
    if (!options?.transform || !options?.type) {
      return
    }

    visit(tree, options?.type, (node) => {
      options?.transform ? options?.transform(node) : node

      return SKIP
    })

    return
  }
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
  const tagNames = [
    ...(defaultSchema.tagNames ?? []),
    ...(options?.allowTags ?? []),
  ].filter((t) => !removeTags.includes(t))

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
    // Creates a HTML AST
    .use(rehypeRaw)
    // Removes disallowed tags
    .use(rehypeSanitize, {
      ...defaultSchema,
      // Don’t prefix the heading ids
      clobberPrefix: '',
      // Makes it even more strict
      tagNames,
      attributes: {
        ...defaultSchema.attributes,
        abbr: ['title'],
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
export function getMarkdownAst(markdown: string) {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown)
}

/**
 * Find all nodes of a specific type in a Markdown AST.
 */
export function getNodesOfType(
  node: Record<string, any>,
  type: string,
  depth: number = 1,
): {
  depth: number
  value: string
}[] {
  const nodes = []

  if (node.type === type) {
    nodes.push({ depth: node.depth ?? depth, value: node.children[0].value })
  }

  if (node.children) {
    for (const child of node.children) {
      nodes.push(...getNodesOfType(child, type, depth + 1))
    }
  }

  return nodes
}
