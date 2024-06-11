import { rehypeHighlight } from '@/rehype-highlight'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import { type Plugin, unified } from 'unified'

import { codeBlockLinesPlugin } from './line-numbers'

export async function syntaxHighlight(
  codeString: string,
  options?: {
    lang?: string
    lineNumbers?: boolean
  },
) {
  const className = options?.lang ? `language-${options?.lang}` : ''

  const nullPlugin = (() => {}) satisfies Plugin

  const html = await unified()
    // Parses markdown
    .use(rehypeParse, { fragment: true })
    // Syntax highlighting
    .use(rehypeHighlight, {
      detect: options?.lang ? false : true,
    })
    .use(options?.lineNumbers ? codeBlockLinesPlugin : nullPlugin)
    // Converts the HTML AST to a string
    .use(rehypeStringify)
    // Run the pipeline
    .process(`<pre><code class="${className}">${codeString}</code></pre>`)

  return html.toString()
}
