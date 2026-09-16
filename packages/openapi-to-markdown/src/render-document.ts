import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import MarkdownReference from './components/MarkdownReference.vue'
import { type OpenApiRenderOptions, selectDocument } from './select-document'

/** Render an already resolved document without loading files or fetching references. */
export const renderDocument = (document: OpenApiDocument, options?: OpenApiRenderOptions): Promise<string> =>
  renderToString(createSSRApp(MarkdownReference, { content: selectDocument(document, options) }))

/** Convert the reference HTML to plain Markdown. */
export const markdownFromHtml = async (html: string): Promise<string> => {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(remarkGfm)
    .use(rehypeSanitize)
    .use(rehypeRemark)
    .use(remarkStringify, {
      bullet: '-',
    })
    .process(html)

  return String(file)
}
