import { normalize } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
// @ts-expect-error TODO: Fix this
import HTMLMinifier from 'html-minifier-terser'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ScalarApiReference from './components/ScalarApiReference.vue'

type AnyDocument = OpenAPIV3_1.Document | Record<string, unknown> | string

export async function createHtmlFromOpenApi(input: AnyDocument) {
  const content = normalize(input)

  // Create and configure a server-side rendered Vue app
  const app = createSSRApp(ScalarApiReference, {
    content,
  })

  // Get static HTML
  const html = await renderToString(app)

  return HTMLMinifier.minify(html, {
    removeComments: true,
    removeCommentsFromCDATA: true,
    removeCDATASectionsFromCDATA: true,
    removeEmptyElements: true,
    removeEmptyElementsFromCDATA: true,
    collapseWhitespace: true,
    continueOnParseError: true,
    noNewlinesBeforeTagClose: true,
    preserveLineBreaks: true,
    removeEmptyAttributes: true,
  })
}

export async function createMarkdownFromOpenApi(content: AnyDocument) {
  return markdownFromHtml(await createHtmlFromOpenApi(content))
}

export async function markdownFromHtml(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize)
    .use(rehypeRemark)
    .use(remarkStringify, {
      bullet: '-',
    })
    .process(html)

  return String(file)
}
