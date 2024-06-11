import { rehypeHighlight } from '@/rehype-highlight'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeFormat from 'rehype-format'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

/** Take a markdown string and generate a raw HTML string */
export async function htmlFromMarkdown(
  markdownString: string,
  options?: {
    removeTags?: string[]
  },
) {
  const html = await unified()
    // Parses markdown
    .use(remarkParse)
    // Support autolink literals, footnotes, strikethrough, tables and tasklists
    .use(remarkGfm)
    // Allows any HTML tags
    .use(remarkRehype, { allowDangerousHtml: true })
    // Creates a HTML AST
    .use(rehypeRaw)
    // Removes disallowed tags
    .use(rehypeSanitize, {
      ...defaultSchema,
      // Makes it even more strict
      tagNames: defaultSchema.tagNames?.filter(
        (tag) => !(options?.removeTags ?? []).includes(tag),
      ),
    })
    // Syntax highlighting
    .use(rehypeHighlight, {
      detect: true,
    })
    // Adds target="_blank" to external links
    .use(rehypeExternalLinks, { target: '_blank' })
    // Formats the HTML
    .use(rehypeFormat)
    // Converts the HTML AST to a string
    .use(rehypeStringify)
    // Run the pipeline
    .process(markdownString)

  return html.toString()
}
