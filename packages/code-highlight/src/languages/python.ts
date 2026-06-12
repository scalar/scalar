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
 * which are mostly calls, attribute chains and keyword arguments, that leaves
 * the bulk of the code unstyled. This wrapper adds four extra modes so that
 * those tokens get colored as well:
 *
 * 1. Class or constructor *calls* (`Profound(`) become `title.class_`.
 * 2. Function and method *calls* (`client.reports.get(`) become
 *    `title.function_`.
 * 3. Attribute access in a chain (`client.reports`) becomes `property`.
 * 4. Keyword arguments and assignment targets (`api_key_header=`, `client =`)
 *    become `attr`, matching how object keys are colored elsewhere.
 *
 * All modes use a string `scope` with a lookahead or lookbehind so only the
 * identifier is captured and the surrounding `(`, `.` or `=` is left untouched.
 * Order matters: the class and function modes are listed before the property
 * mode so that `.method(` is colored as a call rather than a plain attribute.
 * They are appended after the upstream modes so that strings, comments and
 * `def`/`class` titles keep priority and the new modes never fire inside a
 * string or comment. A relevance of `0` keeps language auto-detection
 * unaffected.
 */
const pythonLanguage: LanguageFn = (hljs) => {
  const base = basePython(hljs)

  // Skip reserved words while still allowing identifiers that merely start with
  // one (for example `importlib` must not be excluded by `import`).
  const notReserved = `(?!(?:${RESERVED_WORDS.join('|')})(?![\\w]))`
  const identifier = '[\\p{XID_Start}_]\\p{XID_Continue}*'

  // Capitalized names used as a call, following the PEP 8 convention that class
  // names use CapWords. Listed first so constructors win over the generic call.
  const classCall = {
    scope: 'title.class',
    match: new RegExp(`\\b${notReserved}\\p{Lu}\\p{XID_Continue}*(?=\\s*\\()`, 'u'),
    relevance: 0,
  }

  const functionCall = {
    scope: 'title.function',
    match: new RegExp(`\\b${notReserved}${identifier}(?=\\s*\\()`, 'u'),
    relevance: 0,
  }

  // Attribute access such as the `reports` and `visibility` in a method chain.
  // The class and function modes above already claimed names before a `(`, so
  // this only colors the remaining bare attributes.
  const propertyAccess = {
    scope: 'property',
    match: new RegExp(`(?<=\\.)${identifier}`, 'u'),
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
    contains: [...(base.contains ?? []), classCall, functionCall, propertyAccess, keywordArgument],
  }
}

export default pythonLanguage
