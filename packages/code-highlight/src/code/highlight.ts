import { lowlightLanguageMappings } from '@/constants'
import { rehypeHighlight } from '@/rehype-highlight'
import type { Element, Root } from 'hast'
import type { LanguageFn } from 'highlight.js'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import { type Plugin, unified } from 'unified'
import { visit } from 'unist-util-visit'

import { codeBlockLinesPlugin } from './line-numbers'

export function syntaxHighlight(
  codeString: string,
  options: {
    lang: string
    languages: Record<string, LanguageFn>
    lineNumbers?: boolean
    maskCredentials?: string | string[]
  },
) {
  // Simple restriction on credentials to prevent unexpected behavior
  const credentials = (
    typeof options?.maskCredentials === 'string'
      ? [options.maskCredentials]
      : options?.maskCredentials ?? []
  ).filter((c) => {
    if (c.length < 3) {
      console.error(
        `Codeblock credentials must be at least 3 characters to mask. Will not mask "${c}"`,
      )
      return false
    }
    return true
  })

  // Classname is used by lowlight to select the language model
  const className = `language-${lowlightLanguageMappings[options.lang] ?? options.lang}`

  const nullPlugin = (() => {}) satisfies Plugin

  const html = unified()
    // Parses markdown
    .use(rehypeParse, { fragment: true })
    // Raw code string must be injected after initial hast parsing
    // so that HTML code is not parsed into the hast tree
    .use(injectRawCodeStringPlugin(codeString))
    // Syntax highlighting
    .use(rehypeHighlight, {
      languages: options.languages,
    })
    .use(options?.lineNumbers ? codeBlockLinesPlugin : nullPlugin)
    // Converts the HTML AST to a string
    .use(rehypeStringify)
    // Run the pipeline
    .processSync(`<pre><code class="${className}"></code></pre>`)

  const htmlString = html.toString()

  // Replace any credentials with a wrapper element
  return credentials.length
    ? htmlString.replace(
        new RegExp(credentials.join('|'), 'g'),
        (m) => `<span class="credentials">${m}</span>`,
      )
    : htmlString
}

/**
 * To prevent unified from parsing any content of the code string we inject
 * it as a raw text node into the AST tree as a child of the code element
 */
function injectRawCodeStringPlugin(rawCodeString: string) {
  return () => (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'code') {
        node.children.push({
          type: 'text',
          value: rawCodeString,
        })
      }
    })
  }
}
