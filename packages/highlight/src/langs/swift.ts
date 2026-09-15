import type { Grammar } from '../core/types'

/**
 * Swift.
 *
 * The four things that make Swift awkward for a regex tokenizer, and what this
 * grammar does about each:
 *
 * - Block comments nest. No single regex can count, so an opener pushes the
 *   comment state onto itself and a closer pops one level.
 * - `\(…)` interpolations are real expressions and they nest, so the string
 *   states hand off to a paren-counting state rather than matching to the first
 *   `)`.
 * - Raw strings change what an escape looks like — `\n` is two literal
 *   characters and `\#n` is the newline — which is a different state, not a
 *   flag on the ordinary one.
 * - Argument labels are ordinary words in call position (`f(for: x)`,
 *   `f(in: y)`), so they are matched before the keyword lists and anchored to
 *   the `(` or `,` that introduces them.
 *
 * Identifiers are treated as ASCII. Swift allows most of Unicode in a name, but
 * a non-ASCII name here simply renders unscoped rather than wrong, and the
 * casing rules below — which is where the type/constant/call distinctions come
 * from — only ever apply to the ASCII spelling anyway.
 *
 * Two readings are knowingly wrong, both where the shape is genuinely
 * ambiguous: a trailing-closure call (`items.map { … }`) reads as a property
 * access, because `if user.isActive { … }` is the same shape and more common;
 * and an enum case with associated values (`case notFound(sku: String)`) reads
 * as a call, which is what it looks like everywhere else it appears.
 */
const swift: Grammar = {
  name: 'swift',
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        { include: 'comments' },
        { include: 'strings' },

        // `@escaping`, `@MainActor`, `@available(iOS 15, *)`. The argument list
        // is deliberately left as ordinary code so `iOS 15` still reads as one.
        { match: '@[A-Za-z_]\\w*', scope: 'decorator' },
        // The `#if` / `#available` / `#selector` family. The raw-string rules
        // run first, so a `#` that opens a string never reaches this.
        { match: '#[A-Za-z_]\\w*', scope: 'keyword' },

        { include: 'labels' },

        // Matched at the dot — including the `?.` of an optional chain — so a
        // property named `print` never reads as the global function.
        {
          match: '(\\??\\.)([A-Za-z_]\\w*)(?=\\s*\\()',
          scope: ['punctuation', 'function.method'],
        },
        {
          match: '(\\??\\.)([A-Za-z_]\\w*)',
          scope: ['punctuation', 'variable.member'],
        },

        // Definition sites first: they claim the name before the keyword lists
        // and the casing heuristics get to it.
        {
          match: '(func)(\\s+)([A-Za-z_]\\w*)',
          scope: ['keyword.declaration', null, 'function'],
        },
        {
          match: '(class|struct|enum|protocol|extension|actor)(\\s+)([A-Za-z_]\\w*)',
          scope: ['keyword.declaration', null, 'class'],
        },
        {
          match: '(import)(\\s+)([A-Za-z_][\\w.]*)',
          scope: ['keyword.import', null, 'namespace'],
        },
        { match: '\\bimport\\b', scope: 'keyword.import' },

        {
          match:
            '\\b(?:if|else|guard|switch|case|default|for|while|repeat|break|continue|return|fallthrough|throw|try|catch|defer|do|where|await)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:func|var|let|class|struct|enum|protocol|extension|actor|init|deinit|subscript|typealias|associatedtype|operator|precedencegroup|static|final|lazy|weak|unowned|mutating|nonmutating|override|open|public|internal|fileprivate|private|package|required|convenience|indirect|inout|dynamic|async|throws|rethrows|some|any|get|set|willSet|didSet)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:is|as|in)\\b', scope: 'keyword.operator' },

        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnil\\b', scope: 'constant.builtin' },
        { match: '\\b(?:self|Self|super)\\b', scope: 'variable.builtin' },

        // Longest alternative first: `Any` would otherwise take the front of
        // `AnyObject` and leave the rest to the casing rules.
        {
          match:
            '\\b(?:U?Int(?:8|16|32|64)?|Float|Double|Bool|String|Character|Array|Dictionary|Set|Optional|Result|AnyObject|AnyHashable|Any|Void|Never|Error)\\b',
          scope: 'type.builtin',
        },
        // Guarded by the call lookahead, so `min` as a property name stays a
        // property.
        {
          match:
            '\\b(?:print|debugPrint|dump|assert|assertionFailure|precondition|preconditionFailure|fatalError|abs|min|max|zip|stride|swap|type)\\b(?=\\s*\\()',
          scope: 'function.builtin',
        },

        // SCREAMING_CASE reads as a constant and UpperCamelCase as a type,
        // which covers the standard library without shipping a name list. An
        // all-caps type such as `URL` reads as a constant, which is the price.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z]\\w*\\b', scope: 'type' },
        { match: '\\b[a-z_]\\w*(?=\\s*\\()', scope: 'function.call' },

        // `$0` in a closure and `$binding` for a property wrapper's projected
        // value: compiler-generated names rather than declared ones.
        { match: '\\$\\w+', scope: 'variable.special' },

        { include: 'numbers' },

        {
          match: '->|\\.\\.[.<]|\\?\\?|&&|\\|\\||[!=]==?|<<=?|>>=?|[-+*/%&|^]=?|[<>]=?|[?!~=]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    // ---- argument labels -----------------------------------------------------
    // Anchored on the `(` or `,` in front of the label with a lookbehind rather
    // than by consuming it: a `(` and a `,` want different punctuation scopes,
    // and one captured group can only carry one of them.
    labels: {
      rules: [
        // `func move(from source: Point)` — an external label and the internal
        // name it binds to. Two words before the colon only happen in a
        // declaration, so this never fires on a call.
        {
          match: '(?<=[(,])\\s*([a-z_]\\w*)(\\s+)([a-z_]\\w*)(?=\\s*:)',
          scope: ['variable.parameter', null, 'variable.parameter'],
        },
        // `f(count: 1)` and `(x: Int)`. A ternary is spelled `a ? b : c` with
        // spaces around the colon, so requiring the label to sit directly after
        // the bracket keeps `(flag ? a : b)` out.
        {
          match: '(?<=[(,])\\s*([a-z_]\\w*)(?=\\s*:)',
          scope: ['variable.parameter'],
        },
      ],
    },

    // ---- comments ------------------------------------------------------------
    comments: {
      rules: [
        { match: '///[^\\n]*', scope: 'comment.doc' },
        { match: '//[^\\n]*', scope: 'comment' },
        // `(?![/*])` so the empty comment `/**/` opens a plain block instead of
        // a doc block that the same `/` has to close.
        { match: '/\\*\\*(?![/*])', scope: 'comment.doc', push: 'comment-doc' },
        { match: '/\\*', scope: 'comment', push: 'comment-block' },
      ],
    },
    'comment-block': {
      default: 'comment',
      rules: [
        { match: '/\\*', push: 'comment-block' },
        { match: '\\*/', pop: true },
      ],
    },
    /** A doc block stays documentation all the way down, nesting included. */
    'comment-doc': {
      default: 'comment.doc',
      rules: [
        { match: '/\\*', push: 'comment-doc' },
        { match: '\\*/', pop: true },
      ],
    },

    // ---- strings -------------------------------------------------------------
    // The `#` of a raw string is scoped separately, the way a prefix reads as a
    // modifier on the literal rather than as part of it.
    strings: {
      rules: [
        {
          match: '(#)(""")',
          scope: ['string.special', 'string'],
          push: 'raw-multiline',
        },
        {
          match: '(#)(")',
          scope: ['string.special', 'string'],
          push: 'raw-string',
        },
        { match: '"""', scope: 'string', push: 'multiline' },
        { match: '"', scope: 'string', push: 'string' },
      ],
    },

    /** Escape and interpolation rules shared by both ordinary string states. */
    'string-body': {
      rules: [
        // `\(` opens an interpolation and every other backslash pair is inert,
        // so the interpolation has to be tried first.
        { match: '\\\\\\(', scope: 'interpolation', push: 'interpolation' },
        { match: '\\\\(?:u\\{[0-9a-fA-F]{1,8}\\}|.)', scope: 'string.escape' },
      ],
    },
    string: {
      default: 'string',
      rules: [
        { include: 'string-body' },
        { match: '"', pop: true },
        // An unterminated single-line string ends at the line break instead of
        // swallowing the rest of the file.
        { match: '$', pop: true },
      ],
    },
    multiline: {
      default: 'string',
      rules: [{ include: 'string-body' }, { match: '"""', pop: true }],
    },

    /** In a raw string the escape marker is `\#`; a lone `\` is literal text. */
    'raw-body': {
      rules: [
        { match: '\\\\#\\(', scope: 'interpolation', push: 'interpolation' },
        { match: '\\\\#(?:u\\{[0-9a-fA-F]{1,8}\\}|.)', scope: 'string.escape' },
      ],
    },
    'raw-string': {
      default: 'string',
      rules: [
        { include: 'raw-body' },
        // A bare `"` is ordinary text in a raw string; only `"#` closes it.
        { match: '(")(#)', scope: ['string', 'string.special'], pop: true },
        { match: '$', pop: true },
      ],
    },
    'raw-multiline': {
      default: 'string',
      rules: [{ include: 'raw-body' }, { match: '(""")(#)', scope: ['string', 'string.special'], pop: true }],
    },

    /** `\(…)`, closed by the `)` that balances the one the escape opened. */
    interpolation: {
      rules: [
        { match: '\\)', scope: 'interpolation', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { include: 'expression' },
      ],
    },
    /** Depth tracking, so `"\(f(1))"` does not end at the inner `)`. */
    paren: {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { include: 'expression' },
      ],
    },

    // ---- numbers -------------------------------------------------------------
    numbers: {
      rules: [
        // Hex, optionally a hex fraction and a binary exponent: `0xFF`, `0x1p-8`.
        {
          match: '\\b0[xX][0-9a-fA-F_]+(?:\\.[0-9a-fA-F_]+)?(?:[pP][-+]?\\d[\\d_]*)?\\b',
          scope: 'number',
        },
        { match: '\\b0[bB][01_]+\\b', scope: 'number' },
        { match: '\\b0[oO][0-7_]+\\b', scope: 'number' },
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d[\\d_]*)?\\b',
          scope: 'number',
        },
      ],
    },
  },
}

export default swift
