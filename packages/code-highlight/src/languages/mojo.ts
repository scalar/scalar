import type { LanguageFn } from 'highlight.js'
import basePython from 'highlight.js/lib/languages/python'

/**
 * Mojo grammar.
 *
 * highlight.js does not ship a Mojo grammar and there is no community package
 * for it (the only upstream "mojo" grammar is the unrelated Perl Mojolicious
 * framework). We build one here. Mojo is a superset of Python, so we start from
 * the bundled Python grammar and layer on the extra keywords, argument-convention
 * modifiers, and standard-library types that Mojo adds. The keyword and type
 * lists mirror Modular's official TextMate grammar (github.com/modular/mojo-syntax).
 *
 * As with our custom Python grammar, we also colour call sites as function
 * titles so that API snippets, which are mostly method calls, do not render as a
 * wall of unstyled grey text.
 */
const mojo: LanguageFn = (hljs) => {
  const language = basePython(hljs)
  const { regex } = hljs

  // Mirrors the identifier pattern used by the bundled Python grammar.
  const IDENT_RE = /[\p{XID_Start}_]\p{XID_Continue}*/u

  const keywords = language.keywords as {
    keyword?: string[]
    built_in?: string[]
    literal?: string[]
    type?: string[]
  }

  // Keywords Mojo adds on top of Python: declarations, argument-convention
  // modifiers, function effects, and the comptime metaprogramming family.
  const mojoKeywords = [
    'fn',
    'struct',
    'trait',
    'var',
    'let',
    'alias',
    'comptime',
    'owned',
    'borrowed',
    'inout',
    'ref',
    'mut',
    'read',
    'out',
    'raises',
    'capturing',
  ]

  // Capitalised standard-library types. Python's lowercase builtins (`int`,
  // `str`, ...) already come from the base grammar; these are the Mojo stdlib
  // types that would otherwise render unstyled.
  const mojoTypes = [
    'Int',
    'UInt',
    'Int8',
    'Int16',
    'Int32',
    'Int64',
    'UInt8',
    'UInt16',
    'UInt32',
    'UInt64',
    'Float16',
    'Float32',
    'Float64',
    'Bool',
    'String',
    'StringLiteral',
    'StringSlice',
    'SIMD',
    'DType',
    'Scalar',
    'List',
    'Dict',
    'Set',
    'Tuple',
    'Optional',
    'Variant',
    'Span',
    'Pointer',
    'UnsafePointer',
    'Reference',
    'Error',
  ]

  const dedupe = (...lists: string[][]): string[] => Array.from(new Set(lists.flat()))

  const mergedKeywords = {
    ...keywords,
    keyword: dedupe(keywords.keyword ?? [], mojoKeywords),
    type: dedupe(keywords.type ?? [], mojoTypes),
  }

  // Words the grammar already scopes. Leaving these out of the call-site rule
  // keeps keywords, built-ins, literals, and types coloured as before. Relevance
  // hints such as `nonlocal|10` are stripped so the regex stays valid.
  const reserved = [
    ...(mergedKeywords.keyword ?? []),
    ...(keywords.built_in ?? []),
    ...(keywords.literal ?? []),
    ...(mergedKeywords.type ?? []),
  ].map((word) => word.replace(/\|\d+$/, ''))

  // Negative lookahead that rejects an excluded word when it is the thing being
  // called, so it keeps its original scope. A word boundary asserts the
  // identifier is not exactly a reserved word.
  const notReserved = regex.concat('(?!(?:', reserved.join('|'), ')\\b)')

  // The call lookahead asserts a `(` immediately after the identifier. We do not
  // allow whitespace before it (no `\s*`): the grammar runs this rule at every
  // identifier in untrusted input, so an unbounded whitespace scan would make
  // matching polynomial. Real call sites are written `foo(`, not `foo (`.
  const functionCall = {
    scope: 'title.function',
    relevance: 0,
    match: regex.concat(/\b/, notReserved, IDENT_RE, regex.lookahead(/\(/)),
  }

  return {
    ...language,
    name: 'Mojo',
    aliases: ['mojo', '🔥'],
    keywords: mergedKeywords,
    contains: [...(language.contains ?? []), functionCall],
  }
}

export default mojo
