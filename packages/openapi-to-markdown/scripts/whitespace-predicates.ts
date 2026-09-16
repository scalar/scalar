import type { Plugin } from 'vite'

/**
 * Compile the whitespace normalizer's constant tag tests once instead of per node.
 * Apply this while bundling so published consumers receive the fix too.
 * TODO: Remove when rehype-minify-whitespace ships precompiled predicates upstream.
 */
export const whitespacePredicates = (): Plugin => {
  let patched = false
  return {
    name: 'openapi-markdown-whitespace-predicates',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/rehype-minify-whitespace/lib/index.js')) return
      const replacements = [
        ["import {isElement} from 'hast-util-is-element'", "import {convertElement} from 'hast-util-is-element'"],
        [
          'const emptyOptions = {}',
          'const emptyOptions = {}\nconst isContent = convertElement(contents)\nconst isBlock = convertElement(blocks)\nconst isSkippable = convertElement(skippables)',
        ],
        ['isElement(node, contents)', 'isContent(node)'],
        ['isElement(node, blocks)', 'isBlock(node)'],
        ['isElement(node, skippables)', 'isSkippable(node)'],
      ] as const
      for (const [before, after] of replacements) {
        if (code.split(before).length !== 2) {
          this.error(`Whitespace dependency changed; review the predicate optimization: ${before}`)
        }
        code = code.replace(before, after)
      }
      patched = true
      return { code, map: null }
    },
    generateBundle() {
      if (!patched) this.error('The whitespace optimization must be included in the published bundle')
    },
  }
}
