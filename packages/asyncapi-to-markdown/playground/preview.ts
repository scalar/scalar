import { marked } from 'marked'
import rehypeParse from 'rehype-parse'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import { unified } from 'unified'

// Keep large exports readable without spending time highlighting every example.
// Preserve generated anchor IDs so contents and schema links stay navigable.
const sanitizer = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeSanitize, { clobberPrefix: '' })
  .use(rehypeStringify)
  .freeze()

/** Render a complete export without syntax highlighting or truncating its content. */
export const renderPreview = (markdown: string): string =>
  sanitizer.processSync(marked.parse(markdown, { async: false })).toString()
