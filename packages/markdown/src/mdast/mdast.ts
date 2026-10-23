import type { Root } from 'mdast'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify, { type Options as StringifyOptions } from 'remark-stringify'
import { unified } from 'unified'

/**
 * These live here, rather than in each package that needs them, because this
 * package bundles the unified stack. A package that imported `unified` itself
 * would ship a second copy of the same parsers next to this one, which is what
 * the API Reference standalone build used to do.
 */

const markdownParser = unified().use(remarkParse).use(remarkGfm).freeze()

const htmlConverter = unified().use(rehypeParse, { fragment: true }).use(rehypeSanitize).use(rehypeRemark).freeze()

/** Options for {@link createMarkdownSerializer}, passed through to `remark-stringify`. */
export type MarkdownSerializerOptions = StringifyOptions

/** Parses GitHub Flavored Markdown into an mdast tree. */
export const parseMarkdown = (markdown: string): Root => markdownParser.parse(markdown)

/** Converts an HTML fragment into a sanitized mdast tree. */
export const mdastFromHtml = (html: string): Root => htmlConverter.runSync(htmlConverter.parse(html)) as Root

/**
 * Creates a function that serializes an mdast tree to GitHub Flavored Markdown.
 *
 * Build it once and reuse it: the processor is frozen with the options, so
 * repeated calls do not pay for setting it up again.
 */
export const createMarkdownSerializer = (options?: MarkdownSerializerOptions): ((tree: Root) => string) => {
  const serializer = unified().use(remarkGfm).use(remarkStringify, options).freeze()
  return (tree) => serializer.stringify(tree)
}
