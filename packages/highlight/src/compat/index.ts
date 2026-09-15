/**
 * `@scalar/code-highlight` compatibility layer.
 *
 * Enough of that package's surface to swap this highlighter in underneath
 * `ScalarCodeBlock` without touching the component, the stylesheet, or any
 * caller of `syntaxHighlight`. Registering languages is left to the importer,
 * the same as everywhere else in this package:
 *
 * ```js
 * import '@scalar/highlight/all';                       // or register the few you need
 * import { syntaxHighlight } from '@scalar/highlight/compat';
 * ```
 *
 * What this layer deliberately does *not* cover is the Markdown half of
 * `@scalar/code-highlight` — `htmlFromMarkdown`, `getHeadings`, `splitContent`,
 * `rehypeAlert`, `rehypeHighlight`. Those are a remark/rehype pipeline that has
 * nothing to do with tokenizing code, and they stay where they are.
 */

export type { ToHastOptions } from './hast'
export { toHast } from './hast'
export { HLJS_CLASSES, hljsClass } from './hljs'
export type { StandardLanguageKey } from './languages'
export {
  STANDARD_LANGUAGE_NAMES,
  canonicalName,
  grammarFor,
  lowlightLanguageMappings,
  standardLanguages,
  unsupportedLanguages,
} from './languages'
export type { SyntaxHighlightOptions } from './syntax-highlight'
export { syntaxHighlight } from './syntax-highlight'
