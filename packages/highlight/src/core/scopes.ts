/**
 * The scope vocabulary.
 *
 * Every grammar emits scopes drawn from this list, and every theme styles this
 * list. That contract is what lets a theme look coherent across languages
 * without knowing anything about them.
 *
 * Each scope maps to a short CSS class so the rendered HTML stays small
 * (`<span class="shl-kd">def</span>`). Themes never mention these codes — they
 * are written against the readable scope names and the codes are applied here.
 *
 * Scopes are hierarchical: `function.builtin` falls back to `function` when a
 * theme does not style it. Add a specific scope only when it is worth a
 * distinct color somewhere.
 */
export const SCOPES = {
  // --- comments -------------------------------------------------------------
  comment: 'cm',
  'comment.doc': 'cd',

  // --- literals -------------------------------------------------------------
  string: 's',
  'string.escape': 'se',
  /** Format specs, raw-string prefixes, heredoc markers — string-ish but louder. */
  'string.special': 'ss',
  /** The `${`/`}` of an interpolation, not its contents. */
  interpolation: 'ip',
  regexp: 'rx',
  number: 'n',
  boolean: 'bo',

  // --- names ----------------------------------------------------------------
  constant: 'c',
  /** `None`, `null`, `undefined`, `nil`. */
  'constant.builtin': 'cb',
  variable: 'v',
  /** `self`, `this`, `cls`, `super`. */
  'variable.builtin': 'vb',
  'variable.parameter': 'vp',
  /** `obj.member` — the member half. */
  'variable.member': 'vm',
  /** `__name__`, `__init__` — dunder / magic names. */
  'variable.special': 'vs',

  // --- keywords -------------------------------------------------------------
  keyword: 'k',
  /** `if`, `for`, `return`, `await`, `yield`. */
  'keyword.control': 'kc',
  /** `def`, `class`, `function`, `const`, `struct`. */
  'keyword.declaration': 'kd',
  'keyword.import': 'ki',
  /** Word-shaped operators: `in`, `not`, `and`, `typeof`, `instanceof`. */
  'keyword.operator': 'ko',

  // --- callables and types --------------------------------------------------
  /** Name at a definition site. */
  function: 'f',
  /** Name at a call site. */
  'function.call': 'fc',
  /** `print`, `len`, `parseInt`. */
  'function.builtin': 'fb',
  'function.method': 'fm',
  type: 't',
  /** `int`, `str`, `bool`, `string`, `number`. */
  'type.builtin': 'tb',
  class: 'cl',
  namespace: 'ns',
  decorator: 'dc',

  // --- syntax ---------------------------------------------------------------
  operator: 'o',
  punctuation: 'p',
  'punctuation.bracket': 'pb',
  'punctuation.delimiter': 'pd',

  // --- markup ---------------------------------------------------------------
  tag: 'tg',
  'tag.attribute': 'ta',
  /** CSS declarations, JSON keys, YAML keys. */
  property: 'pr',
  selector: 'sl',
  /** CSS `px`, `rem`, `%`. */
  unit: 'u',
  heading: 'h',
  link: 'ln',
  emphasis: 'em',
  strong: 'sg',
  quote: 'q',
  list: 'li',
  'diff.plus': 'dp',
  'diff.minus': 'dm',

  invalid: 'iv',
} as const

export type Scope = keyof typeof SCOPES

/** All scope names, ordered most-general first so fallback walks resolve. */
export const SCOPE_NAMES = Object.keys(SCOPES) as Scope[]

/**
 * Resolve a scope to its CSS class suffix. Unknown scopes degrade to a
 * slugified name rather than throwing, so a custom grammar still renders.
 */
export const scopeClass = (scope: string): string => {
  // `hasOwn` because a scope is data a grammar supplies: a scope named
  // `constructor` or `toString` would otherwise resolve off Object.prototype
  // and stringify a function into the class attribute rather than slugifying.
  const known = Object.hasOwn(SCOPES, scope) ? (SCOPES as Record<string, string>)[scope] : undefined
  return known ?? scope.replace(/[^a-zA-Z0-9]+/g, '-')
}

/**
 * Walk a scope from most to least specific: `a.b.c` -> `a.b.c`, `a.b`, `a`.
 * Used by themes to inherit styling from a parent scope.
 */
export const scopeChain = (scope: string): string[] => {
  const out = [scope]
  let i = scope.lastIndexOf('.')
  while (i > 0) {
    out.push(scope.slice(0, i))
    i = scope.lastIndexOf('.', i - 1)
  }
  return out
}
