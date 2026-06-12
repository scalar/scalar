import type { LanguageFn } from 'highlight.js'
import basePython from 'highlight.js/lib/languages/python'

/**
 * Reserved words that must never be treated as a function call or a keyword
 * argument. The base grammar already colors these as keywords or literals, and
 * statements such as `if (...)`, `while (...)`, or `return (...)` would
 * otherwise be mistaken for function calls. `print` and `self` are kept here so
 * they retain their more specific `built_in` and `variable.language` scopes.
 */
const RESERVED_WORDS = [
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'case',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'match',
  'nonlocal',
  'not',
  'or',
  'pass',
  'print',
  'raise',
  'return',
  'self',
  'try',
  'while',
  'with',
  'yield',
  'True',
  'False',
  'None',
]

/**
 * Python grammar that extends the one shipped with highlight.js.
 *
 * The upstream grammar only tags keywords, strings, numbers, decorators and the
 * names in `def`/`class` *definitions*. For typical API reference snippets,
 * which are mostly function calls and keyword arguments, that leaves the bulk of
 * the code unstyled. This wrapper adds two extra modes so that those tokens get
 * colored as well:
 *
 * 1. Function and method *calls* (`Profound(`, `client.reports.get(`) become
 *    `title.function_`.
 * 2. Keyword arguments and assignment targets (`api_key_header=`, `client =`)
 *    become `attr`, matching how object keys are colored elsewhere.
 *
 * Both modes use a string `scope` with a lookahead so only the identifier is
 * captured and the trailing `(` or `=` is left untouched. They are appended to
 * the end of `contains` so that strings, comments and `def`/`class` titles keep
 * priority and the new modes never fire inside a string or comment. A relevance
 * of `0` keeps language auto-detection unaffected.
 */
const pythonLanguage: LanguageFn = (hljs) => {
  const base = basePython(hljs)

  // Skip reserved words while still allowing identifiers that merely start with
  // one (for example `importlib` must not be excluded by `import`).
  const notReserved = `(?!(?:${RESERVED_WORDS.join('|')})(?![\\w]))`
  const identifier = '[\\p{XID_Start}_]\\p{XID_Continue}*'

  const functionCall = {
    scope: 'title.function',
    match: new RegExp(`\\b${notReserved}${identifier}(?=\\s*\\()`, 'u'),
    relevance: 0,
  }

  // Match an identifier followed by a single `=`, but never `==`, `>=`, `<=`,
  // `!=` or `:=`, so comparisons and the walrus operator are left alone.
  const keywordArgument = {
    scope: 'attr',
    match: new RegExp(`\\b${notReserved}${identifier}(?=\\s*=(?!=))`, 'u'),
    relevance: 0,
  }

  return {
    ...base,
    contains: [...(base.contains ?? []), functionCall, keywordArgument],
  }
}

export default pythonLanguage
