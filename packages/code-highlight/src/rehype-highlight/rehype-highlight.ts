import type { Element, ElementContent, Root } from 'hast'
import { toText } from 'hast-util-to-text'
import { type LanguageFn, createLowlight } from 'lowlight'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

import { lowlightLanguageMappings } from '../constants'

type HighlightOptions = {
  /** Optional existing lowlight instance to use */
  lowlight?: ReturnType<typeof createLowlight> | undefined
  /** Register more aliases (optional); passed to `lowlight.registerAlias` */
  aliases?: Readonly<Record<string, ReadonlyArray<string> | string>> | null | undefined
  /** Register languages (default: `common`) passed to `lowlight.register` */
  languages?: Readonly<Record<string, LanguageFn>> | null | undefined
  /** List of language names to not highlight (optional). Note: you can also add `no-highlight` classes. */
  plainText?: ReadonlyArray<string> | null | undefined
  /** Class prefix (default: `'hljs-'`) */
  prefix?: string | null | undefined
  /** Names of languages to check when detecting (default: all registered languages) */
  subset?: ReadonlyArray<string> | null | undefined
  /** Option to autodetect languages */
  detect?: boolean
}

const emptyOptions: HighlightOptions = {}

/**
 * Lowlight syntax highlighting plugin for rehype pipelines
 *
 * Derived from: @url https://github.com/rehypejs/rehype-highlight/blob/main/lib/index.js
 */
export function rehypeHighlight(options?: Readonly<HighlightOptions> | null | undefined) {
  const settings = options || emptyOptions
  const aliases = settings.aliases
  const detect = options?.detect ?? false
  const languages = settings.languages
  const plainText = settings.plainText
  const prefix = settings.prefix
  const subset = settings.subset
  let name = 'hljs'

  // Create a lowlight instance if not provided
  const lowlight = options?.lowlight ?? createLowlight(languages)

  if (aliases) {
    lowlight.registerAlias(aliases)
  }

  if (prefix) {
    const pos = prefix.indexOf('-')
    name = pos > -1 ? prefix.slice(0, pos) : prefix
  }

  /** Transform.*/
  return (tree: Root, file: VFile) => {
    visit(tree, 'element', (node, _, parent) => {
      if (node.tagName !== 'code' || !parent || parent.type !== 'element' || parent.tagName !== 'pre') {
        return
      }

      const lang = language(node)

      if (lang === 'no-highlight' || (!lang && !detect) || (lang && plainText?.includes(lang))) {
        return
      }

      if (!Array.isArray(node.properties.className)) {
        node.properties.className = []
      }

      if (!node.properties.className.includes(name)) {
        node.properties.className.unshift(name)
      }

      let result: Root | undefined

      try {
        result = lang
          ? lowlight.highlight(lang, toText(parent), { prefix })
          : lowlight.highlightAuto(toText(parent), { prefix, subset })
      } catch (error) {
        const cause = error as Error

        if (lang && /Unknown language/.test(cause.message)) {
          file.message(`Cannot highlight as \`${lang}\`, it's not registered`, {
            ancestors: [parent, node],
            cause,
            place: node.position,
            ruleId: 'missing-language',
            source: 'rehype-highlight',
          })

          /* c8 ignore next 5 -- throw arbitrary hljs errors */
          return
        }

        throw cause
      }

      if (!lang && result.data?.language) {
        node.properties.className.push('language-' + result.data.language)
      }

      if (result.children.length > 0) {
        node.children = result.children as Array<ElementContent>
      }
    })
  }
}

/** Get the programming language of `node` or an empty string */
function language(node: Element) {
  const list = node.properties.className

  if (!Array.isArray(list)) {
    return ''
  }

  const name: string = list.reduce<string>((result, _item) => {
    if (result) {
      return result
    }
    const item = String(_item)

    if (item === 'no-highlight' || item === 'nohighlight') {
      return 'no-highlight'
    }
    if (item.slice(0, 5) === 'lang-') {
      return item.slice(5)
    }
    if (item.slice(0, 9) === 'language-') {
      return item.slice(9)
    }

    return result
  }, '')

  return lowlightLanguageMappings[name || ''] || name
}
