/**
 * Stands in for `@scalar/code-highlight` (and its `/markdown` entry) when
 * measuring the real API Reference bundle with the prototype. Code blocks are
 * highlighted with `@scalar/highlight`, which `ScalarCodeBlock` already ships.
 */
import { syntaxHighlight } from '../../../../packages/highlight/dist/compat/index.js'
import {
  type HtmlFromMarkdownOptions,
  getHeadings,
  isHeading,
  htmlFromMarkdown as render,
  splitContent,
  textFromNode,
} from '../../src/index'

const highlight = (code: string, lang: string | null) => {
  if (!lang) return null
  try {
    const html = syntaxHighlight(code, { lang })
    return { html: html.slice(html.indexOf('>', html.indexOf('<code')) + 1, html.lastIndexOf('</code>')) }
  } catch {
    return null
  }
}

export const htmlFromMarkdown = (markdown: string, options?: HtmlFromMarkdownOptions): string =>
  render(markdown, { ...options, highlight })

export { getHeadings, isHeading, splitContent, textFromNode }
