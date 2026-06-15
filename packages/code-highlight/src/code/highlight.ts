import type { Element, ElementContent } from 'hast'
import { toHtml } from 'hast-util-to-html'

import { getShikiHighlighter, loadLanguage } from '../shiki/highlighter'
import { SCALAR_THEME_NAME } from '../shiki/theme'

/** Class added to the rendered `<code>` element so the CSS can target it. */
const CODE_CLASS = 'scalar-code-highlight'

/**
 * Syntax highlights a code string with Shiki.
 *
 * Only the Shiki core is loaded up front; the grammar for `lang` is fetched on
 * demand the first time it is needed (and cached afterwards), so each language
 * is its own lazily loaded chunk.
 *
 * Returns the inner `<code>` element as an HTML string (without a wrapping
 * `<pre>`), ready to be injected into a `<pre>` by the caller.
 */
export async function syntaxHighlight(
  codeString: string,
  options: {
    lang: string
    lineNumbers?: boolean
    maskCredentials?: string | string[]
  },
): Promise<string> {
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

  const highlighter = await getShikiHighlighter()

  // Resolve the language and lazily load its grammar (falls back to plain text)
  const lang = await loadLanguage(options.lang)

  const tree = highlighter.codeToHast(codeString, {
    lang,
    theme: SCALAR_THEME_NAME,
  })

  // Shiki wraps everything in `<pre><code>`. We only want the `<code>` element
  // so it can be dropped straight into the caller's own `<pre>`.
  const pre = tree.children.find((node): node is Element => node.type === 'element' && node.tagName === 'pre')
  const code = pre?.children.find((node): node is Element => node.type === 'element' && node.tagName === 'code')

  if (!code) {
    return `<code class="${CODE_CLASS}"></code>`
  }

  const classNames = [CODE_CLASS, `language-${lang}`]

  if (options?.lineNumbers) {
    classNames.push('line-numbers')

    // Size the line-number gutter to fit the largest line number.
    const lineCount = code.children.filter(
      (node) => node.type === 'element' && asClassList(node).includes('line'),
    ).length

    code.properties.style = `--line-digits: ${Math.max(1, lineCount).toString().length}`
  }

  code.properties.className = classNames

  const htmlString = toHtml(code)

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

/** Read a hast element's class list as an array of strings. */
function asClassList(node: ElementContent): string[] {
  if (node.type !== 'element') {
    return []
  }

  const className = node.properties?.className

  if (Array.isArray(className)) {
    return className.map(String)
  }

  return typeof className === 'string' ? className.split(' ') : []
}
