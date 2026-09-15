import { scopeChain } from '../core/scopes'

/**
 * Scope vocabulary -> highlight.js class names.
 *
 * `@scalar/code-highlight` renders through lowlight, so every stylesheet and
 * screenshot in the ecosystem is written against `hljs-*` classes. Emitting
 * those classes is what makes a swap invisible: `packages/code-highlight/src/css/code.css`
 * keeps working unchanged, and nothing downstream has to be restyled.
 *
 * Values are full class attributes, not suffixes, because highlight.js uses
 * two-class tokens for a few scopes (`hljs-title function_`).
 *
 * `null` means "emit bare text". highlight.js leaves operators unscoped, and a
 * span nobody styles is bytes for nothing.
 */
const HLJS_CLASSES: Record<string, string | null> = {
  // --- comments -------------------------------------------------------------
  comment: 'hljs-comment',
  'comment.doc': 'hljs-comment',

  // --- literals -------------------------------------------------------------
  string: 'hljs-string',
  'string.escape': 'hljs-string',
  'string.special': 'hljs-string',
  interpolation: 'hljs-subst',
  regexp: 'hljs-regexp',
  number: 'hljs-number',
  boolean: 'hljs-literal',

  // --- names ----------------------------------------------------------------
  constant: 'hljs-variable',
  'constant.builtin': 'hljs-literal',
  variable: 'hljs-variable',
  'variable.builtin': 'hljs-variable',
  'variable.parameter': 'hljs-params',
  'variable.member': 'hljs-property',
  'variable.special': 'hljs-variable',

  // --- keywords -------------------------------------------------------------
  keyword: 'hljs-keyword',
  'keyword.control': 'hljs-keyword',
  'keyword.declaration': 'hljs-keyword',
  'keyword.import': 'hljs-keyword',
  'keyword.operator': 'hljs-keyword',

  // --- callables and types --------------------------------------------------
  function: 'hljs-title function_',
  'function.call': 'hljs-title function_',
  'function.builtin': 'hljs-built_in',
  'function.method': 'hljs-title function_',
  // highlight.js reserves `hljs-type` for type *keywords* and puts named
  // types under `hljs-title class_`, which is what `code.css` colours as a
  // class name. `int`, `str`, `string`, `number` land on `hljs-built_in`
  // there, so they do here too.
  type: 'hljs-title class_',
  'type.builtin': 'hljs-built_in',
  class: 'hljs-title class_',
  namespace: 'hljs-title class_',
  decorator: 'hljs-meta',

  // --- syntax ---------------------------------------------------------------
  operator: null,
  punctuation: 'hljs-punctuation',
  'punctuation.bracket': 'hljs-punctuation',
  'punctuation.delimiter': 'hljs-punctuation',

  // --- markup ---------------------------------------------------------------
  tag: 'hljs-name',
  'tag.attribute': 'hljs-attr',
  property: 'hljs-attr',
  selector: 'hljs-selector-tag',
  unit: 'hljs-number',
  heading: 'hljs-section',
  link: 'hljs-link',
  emphasis: 'hljs-emphasis',
  strong: 'hljs-strong',
  quote: 'hljs-quote',
  list: 'hljs-bullet',
  'diff.plus': 'hljs-addition',
  'diff.minus': 'hljs-deletion',

  invalid: null,
}

/**
 * Resolves a scope to its highlight.js class attribute.
 *
 * Unknown scopes walk up the chain — a grammar that emits `string.heredoc`
 * still lands on `hljs-string` rather than falling out of the theme.
 */
export const hljsClass = (scope: string): string | null => {
  for (const name of scopeChain(scope)) {
    // `hasOwn` because scope names come from grammar data: `constructor` or
    // `toString` would otherwise resolve off Object.prototype instead of
    // falling through to the next, less specific scope. An owned value is
    // `string | null` (null means bare text); `?? null` only satisfies the
    // index-access type, it never fires for a key we have confirmed we own.
    if (Object.hasOwn(HLJS_CLASSES, name)) return HLJS_CLASSES[name] ?? null
  }
  return null
}

export { HLJS_CLASSES }
