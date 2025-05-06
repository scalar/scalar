import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
// @ts-expect-error TODO: Fix this
import HTMLMinifier from '../node_modules/html-minifier-terser/dist/htmlminifier.esm.bundle.js'
import ScalarApiReference from './components/ScalarApiReference.vue'

export async function createHtmlFromOpenApi(content: OpenAPIV3_1.Document | Record<string, unknown>) {
  // Create and configure a server-side rendered Vue app
  const app = createSSRApp(ScalarApiReference, {
    content,
  })

  // Get static HTML
  const html = await renderToString(app)

  console.log(html)

  return HTMLMinifier.minify(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    ${html}
  </body>
</html>
`,
    {
      removeComments: true,
      removeCommentsFromCDATA: true,
      removeCDATASectionsFromCDATA: true,
      removeEmptyElements: true,
      removeEmptyElementsFromCDATA: true,
    },
  )
}

export async function createMarkdownFromOpenApi(content: OpenAPIV3_1.Document | Record<string, unknown>) {
  return markdownFromHtml(await createHtmlFromOpenApi(content))
}

export async function markdownFromHtml(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse)
    .use(rehypeRemark)
    .use(remarkStringify, {
      bullet: '-',
    })
    .process(html)

  return (
    String(file)
      // TODO: Better way to remove HTML comments
      .replace(/<!--[\s\S]*?(?:-->)/g, '')
    // Make sure there's never more than one empty line
    // TODO: Is there a better way to do this?
    // .replace(/\n\n+/g, '\n\n')
  )
}
