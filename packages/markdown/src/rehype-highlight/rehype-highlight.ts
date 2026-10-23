import { toHast } from '@scalar/highlight/compat'
import type { Element, Root } from 'hast'
import { toText } from 'hast-util-to-text'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

declare module 'vfile' {
  interface DataMap {
    /**
     * Languages of the code blocks that rendered as plain text because no
     * grammar was registered for them, in highlight.js vocabulary.
     */
    missingLanguages: string[]
  }
}

type HighlightOptions = {
  /** Extra class name(s) to add to highlighted `<code>` elements (optional) */
  className?: ReadonlyArray<string> | string | null | undefined
}

/**
 * Syntax highlighting plugin for rehype pipelines, built on `@scalar/highlight`.
 *
 * Emits the same `hljs` / `hljs-*` classes the lowlight version did, so
 * `code.css` styles the result without changes.
 *
 * There is no language detection: a fence without a language is left as plain
 * text. highlight.js guessed one, and the guess was often wrong, so an
 * unlabeled block rendering uncoloured is the more honest result.
 *
 * Only registered grammars highlight. This plugin registers none itself, so a
 * page downloads just the grammars its code blocks use: a block whose grammar
 * is missing renders as plain text and its language lands in
 * `file.data.missingLanguages`, for the caller to load and render again.
 */
export function rehypeHighlight(options?: Readonly<HighlightOptions> | null | undefined) {
  const extraClassNames = typeof options?.className === 'string' ? [options.className] : (options?.className ?? [])

  return (tree: Root, file: VFile) => {
    visit(tree, 'element', (node, _, parent) => {
      if (node.tagName !== 'code' || !parent || parent.type !== 'element' || parent.tagName !== 'pre') {
        return
      }

      const lang = language(node)

      if (lang === 'no-highlight') {
        return
      }

      if (!Array.isArray(node.properties.className)) {
        node.properties.className = []
      }

      // Unlabeled blocks still get the classes, so they share the look of
      // every other code block and only lose the colours.
      if (!node.properties.className.includes('hljs')) {
        node.properties.className.unshift('hljs')
      }

      for (const extraClassName of extraClassNames) {
        if (!node.properties.className.includes(extraClassName)) {
          node.properties.className.push(extraClassName)
        }
      }

      if (!lang) {
        return
      }

      try {
        const children = toHast(toText(parent), lang)

        if (children === null) {
          file.data.missingLanguages ??= []
          if (!file.data.missingLanguages.includes(lang)) {
            file.data.missingLanguages.push(lang)
          }

          file.message(`Cannot highlight as \`${lang}\`, it's not registered`, {
            ancestors: [parent, node],
            place: node.position,
            ruleId: 'missing-language',
            source: 'rehype-highlight',
          })

          return
        }

        if (children.length > 0) {
          node.children = children
        }
      } catch (error) {
        // Highlighting is best-effort, so a grammar that throws must not take
        // down the whole Markdown render. Fall back to the plain code block.
        file.message('Could not highlight code block', {
          ancestors: [parent, node],
          cause: error as Error,
          place: node.position,
          ruleId: 'highlight-error',
          source: 'rehype-highlight',
        })
      }
    })
  }
}

/** Get the programming language of `node` or an empty string */
function language(node: Element): string {
  const list = node.properties.className

  if (!Array.isArray(list)) {
    return ''
  }

  for (const entry of list) {
    const item = String(entry)

    if (item === 'no-highlight' || item === 'nohighlight') {
      return 'no-highlight'
    }
    if (item.startsWith('lang-')) {
      return item.slice(5)
    }
    if (item.startsWith('language-')) {
      return item.slice(9)
    }
  }

  return ''
}
