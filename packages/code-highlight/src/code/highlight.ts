import type { Element, Root } from 'hast'
import type { LanguageFn } from 'highlight.js'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import { unified, type Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import { lowlightLanguageMappings } from '@/constants'
import { rehypeHighlight } from '@/rehype-highlight'

import { codeBlockLinesPlugin } from './line-numbers'

/**
 * Syntax highlights a code string using the `rehype-highlight` library.
 */
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
    typeof options?.maskCredentials === 'string' ? [options.maskCredentials] : (options?.maskCredentials ?? [])
  ).filter((c) => {
    // Credentials must be at least 3 characters to mask.
    if (c.length < 3) {
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
    ? credentials.reduce(
        (acc, credential) =>
          acc
            .split(credential)
            .join(`<span class="credential"><span class="credential-value">${credential}</span></span>`),
        htmlString,
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
