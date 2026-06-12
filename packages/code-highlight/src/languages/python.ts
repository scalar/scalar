import type { LanguageFn } from 'highlight.js'
import basePython from 'highlight.js/lib/languages/python'

/**
 * Python grammar that extends highlight.js' bundled grammar with call-site
 * highlighting.
 *
 * The grammar shipped with highlight.js only scopes function and class
 * *definitions* (`def name`, `class Name`) plus a fixed list of built-ins. It
 * never scopes *call sites*, unlike the JavaScript, Go, and Ruby grammars which
 * colour every `.method()` as a function title. Because real-world API snippets
 * are almost entirely method calls (for example `conn.request(...)` or
 * `response.json()`), Python code rendered as a wall of unstyled grey text and
 * looked far less highlighted than other languages (DOC-5618).
 *
 * We add a single rule that colours any identifier immediately followed by `(`
 * as a function title, mirroring how highlight.js' own JavaScript grammar
 * handles this. Reserved words and the grammar's known built-ins, literals, and
 * types are excluded so they keep their existing scopes, and the leading word
 * boundary prevents the rule from matching the tail end of an excluded word.
 */
const python: LanguageFn = (hljs) => {
  const language = basePython(hljs)
  const { regex } = hljs

  // Mirrors the identifier pattern used by the bundled Python grammar.
  const IDENT_RE = /[\p{XID_Start}_]\p{XID_Continue}*/u

  // Words the base grammar already scopes. Leaving these out of the call-site
  // rule keeps keywords (`return`, `if`, ...) and built-ins (`print`, `range`,
  // ...) coloured as before. Relevance hints such as `nonlocal|10` are stripped.
  const keywords = language.keywords as {
    keyword?: string[]
    built_in?: string[]
    literal?: string[]
    type?: string[]
  }
  const reserved = [
    ...(keywords.keyword ?? []),
    ...(keywords.built_in ?? []),
    ...(keywords.literal ?? []),
    ...(keywords.type ?? []),
  ].map((word) => word.replace(/\|\d+$/, ''))

  // Negative lookahead that rejects an excluded word when it is the thing being
  // called (for example `print(`), so it keeps its original scope.
  const notReserved = regex.concat('(?!', reserved.map((word) => `${word}\\s*\\(`).join('|'), ')')

  const functionCall = {
    scope: 'title.function',
    relevance: 0,
    match: regex.concat(/\b/, notReserved, IDENT_RE, regex.lookahead(/\s*\(/)),
  }

  return {
    ...language,
    contains: [...(language.contains ?? []), functionCall],
  }
}

export default python
