import type { Grammar } from '../core/types'

/**
 * Dart.
 *
 * The four places a regex-based highlighter usually goes wrong in this
 * language, and what this grammar does about them:
 *
 * - Interpolation nests, and the inner literal may reuse the outer quote —
 *   `'${map['key']}'` is legal Dart. The interpolation body is a real
 *   expression state, so the inner string opens and closes on its own instead
 *   of the outer one ending early.
 * - Raw strings switch escapes and interpolation off, so they get their own
 *   rules rather than sharing the interpolating states.
 * - Block comments nest. One comment can contain a whole commented-out block
 *   with comments of its own, which needs a state, not a scan to the first
 *   closing delimiter.
 * - `1.toString()` is a method call on an int, so the double pattern insists on
 *   a digit after the decimal point rather than treating `1.` as a literal.
 *
 * Ordinary identifiers deliberately match no rule and inherit the block's
 * foreground, which keeps both the markup and the visual noise down.
 */

/**
 * An identifier.
 *
 * `$` is legal in a Dart identifier but is not a `\w` character, so `\b` sits
 * between every `$` and the letter after it. In `$a$a$a…` — one identifier —
 * that is a boundary every two characters, and the rules that match a name and
 * then test a lookahead would restart at each one and rescan the line. The cap
 * bounds that; a longer name simply renders unscoped.
 */
const ID = '[A-Za-z_$][\\w$]{0,128}'

/** `\n`, `\$`, `\x41`, `\u2603`, `\u{1F600}`. */
const ESCAPE = '\\\\(?:u\\{[0-9a-fA-F]+\\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)'

/**
 * Keywords that can sit directly in front of a call and would otherwise look
 * like the return type of a definition (`return foo()`, `const Text()`).
 *
 * The `\b` is load-bearing: without it the alternation also matches the *tail*
 * of an ordinary type name, so `Canvas paint(…)` (ends in `as`) or
 * `Axis resolve(…)` (ends in `is`) would suppress their own definition rule.
 * `=>` gets its own lookbehind because `\b` cannot anchor a non-word token; it
 * is excluded for the same reason the keywords are — it ends in `>`, exactly
 * like the type arguments a real definition would end with.
 */
const NOT_A_RETURN_TYPE = '(?<!=>[ \\t])(?<!\\b(?:return|await|yield|throw|new|const|case|else|in|is|as)[ \\t])'

const dart: Grammar = {
  name: 'dart',
  states: {
    root: {
      rules: [{ match: '^#!.*', scope: 'comment' }, { include: 'expression' }],
    },

    expression: {
      rules: [
        // ---- comments ------------------------------------------------------
        { match: '///[^\\n]*', scope: 'comment.doc' },
        { match: '//[^\\n]*', scope: 'comment' },
        // `(?![/*])` keeps `/**/` and `/***` out of the doc state, matching how
        // dartdoc reads them.
        { match: '/\\*\\*(?![/*])', scope: 'comment.doc', push: 'comment-doc' },
        { match: '/\\*', scope: 'comment', push: 'comment-block' },

        { include: 'strings' },
        { include: 'numbers' },

        // Metadata. `@override` and `@JsonKey(name: 'a')` both read as
        // annotations, dotted path included.
        { match: `@${ID}(?:\\.${ID})*`, scope: 'decorator' },

        // ---- member access -------------------------------------------------
        // Spread first: `..` would otherwise claim the first two dots of `...`.
        { match: '\\.\\.\\.\\??', scope: 'operator' },
        // A cascade is an operator and a plain access is punctuation, but both
        // are followed by the same two shapes, so each needs its own pair.
        {
          match: `(\\?\\.\\.|\\.\\.)([ \\t]*)(${ID})(?=[ \\t]*\\()`,
          scope: ['operator', null, 'function.method'],
        },
        {
          match: `(\\?\\.\\.|\\.\\.)([ \\t]*)(${ID})`,
          scope: ['operator', null, 'variable.member'],
        },
        {
          match: `(\\?\\.|\\.)([ \\t]*)(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', null, 'function.method'],
        },
        {
          match: `(\\?\\.|\\.)([ \\t]*)(${ID})`,
          scope: ['punctuation', null, 'variable.member'],
        },

        // ---- keywords ------------------------------------------------------
        {
          match:
            '\\b(?:if|else|for|while|do|switch|case|default|break|continue|return|yield|await|throw|rethrow|try|catch|finally|assert)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:abstract|async|base|class|const|covariant|enum|extends|extension|external|factory|final|get|implements|interface|late|mixin|operator|required|sealed|set|static|sync|typedef|var|with|on)\\b',
          scope: 'keyword.declaration',
        },
        // `show`, `hide`, `of` and `part` are contextual: Dart only reserves
        // them inside a directive. Used as plain names they read as keywords
        // here, which is wrong but vanishingly rare in real code.
        {
          match: '\\b(?:import|export|library|part|deferred|show|hide|of)\\b',
          scope: 'keyword.import',
        },
        { match: '\\b(?:is|as|in|new)\\b', scope: 'keyword.operator' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnull\\b', scope: 'constant.builtin' },
        { match: '\\b(?:this|super)\\b', scope: 'variable.builtin' },

        // ---- names ---------------------------------------------------------
        // Only the types the language itself special-cases — literal types, the
        // top and bottom of the hierarchy, and the collection and async types
        // with their own syntax. The rest of `dart:core` is CapWords and lands
        // on `type` a rule below, which is the right fallback anyway.
        {
          match:
            '\\b(?:int|double|num|bool|String|List|Map|Set|Iterable|Future|Stream|Object|Function|Never|Null|dynamic|void)\\b',
          scope: 'type.builtin',
        },
        // SCREAMING_CASE reads as a constant and CapWords as a type. Dart style
        // prefers lowerCamelCase for constants, so the first rule mostly earns
        // its keep on generated and ported code.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_$]*\\b', scope: 'type' },

        // `print` is the one top-level function in `dart:core` a reader expects
        // to stand out. Gated on the call to keep `logger.print` a method.
        { match: '\\bprint\\b(?=[ \\t]*\\()', scope: 'function.builtin' },

        // `Type name(` is a definition; a bare `name(` is a call.
        //
        // The lookbehind wants the token in front to end the way a type does: a
        // word character, the `>` of type arguments, or the `?` of a nullable
        // type. That alone would also accept `cond ? run()` and `=> run()`, so
        // the ternary is excluded by requiring a type character before the `?`
        // and the rest by name. What survives and is still wrong: a definition
        // whose return type is omitted, and a call written as `foo bar()`,
        // which is not valid Dart anyway.
        {
          match: `(?<=[\\w>]\\??[ \\t])${NOT_A_RETURN_TYPE}[a-z_$][\\w$]{0,128}(?=[ \\t]*[(<])`,
          scope: 'function',
        },
        { match: `\\b${ID}(?=[ \\t]*\\()`, scope: 'function.call' },
        // A named argument, record field or map key. Requiring no space before
        // the colon is what keeps `cond ? a : b` out; `cond ? a:b` still slips
        // through, and a statement label reads as one of these too.
        { match: `\\b${ID}(?=:)`, scope: 'variable.parameter' },

        // ---- syntax --------------------------------------------------------
        {
          match: '=>|\\?\\?=?|~/=?|\\+\\+|--|&&|\\|\\||<<=?|>>>?=?|[!=]=|[-+*/%&|^]=?|[<>]=?|[?!~=]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    numbers: {
      rules: [
        { match: '\\b0[xX][0-9a-fA-F_]+\\b', scope: 'number' },
        // A digit is required after the point so `1.toString()` stays an int
        // and a method call. Digit separators arrived in Dart 3.6.
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d+)?\\b',
          scope: 'number',
        },
      ],
    },

    // ---- strings -----------------------------------------------------------
    strings: {
      rules: [
        // The `r` is scoped separately so it reads as a modifier on the literal
        // rather than as part of it. A single-line raw string cannot contain
        // its own quote — there is no escape to write one with — so those two
        // forms are one bounded scan each and never need a state; only the
        // triple-quoted forms, which do span lines, get one.
        {
          match: "\\b(r)(''')",
          scope: ['string.special', 'string'],
          push: 'raw-triple-single',
        },
        {
          match: '\\b(r)(""")',
          scope: ['string.special', 'string'],
          push: 'raw-triple-double',
        },
        { match: "\\b(r)('[^'\\n]*')", scope: ['string.special', 'string'] },
        { match: '\\b(r)("[^"\\n]*")', scope: ['string.special', 'string'] },

        { match: "'''", scope: 'string', push: 'triple-single' },
        { match: '"""', scope: 'string', push: 'triple-double' },
        { match: "'", scope: 'string', push: 'single' },
        { match: '"', scope: 'string', push: 'double' },
      ],
    },

    'string-body': {
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: '\\$\\{', scope: 'interpolation', push: 'interpolation' },
        // `$name` takes the bare identifier and nothing else: `'$a.b'`
        // interpolates `a` and then prints a literal `.b`.
        { match: `(\\$)(${ID})`, scope: ['interpolation', 'variable'] },
      ],
    },

    single: {
      default: 'string',
      rules: [
        { include: 'string-body' },
        { match: "'", scope: 'string', pop: true },
        // An unterminated single-line string ends at the line break instead of
        // swallowing the rest of the file.
        { match: '$', pop: true },
      ],
    },
    double: {
      default: 'string',
      rules: [{ include: 'string-body' }, { match: '"', scope: 'string', pop: true }, { match: '$', pop: true }],
    },
    'triple-single': {
      default: 'string',
      rules: [{ include: 'string-body' }, { match: "'''", scope: 'string', pop: true }],
    },
    'triple-double': {
      default: 'string',
      rules: [{ include: 'string-body' }, { match: '"""', scope: 'string', pop: true }],
    },

    // No escape or interpolation rules: that is the whole point of the `r`.
    'raw-triple-single': {
      default: 'string',
      rules: [{ match: "'''", scope: 'string', pop: true }],
    },
    'raw-triple-double': {
      default: 'string',
      rules: [{ match: '"""', scope: 'string', pop: true }],
    },

    interpolation: {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },
    /** Tracks brace depth so a map literal or closure cannot end an interpolation. */
    brace: {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },

    // ---- comments ----------------------------------------------------------
    // Both states push themselves on a nested opener, so the comment ends at
    // the delimiter that actually balances it.
    'comment-block': {
      default: 'comment',
      rules: [
        { match: '/\\*', push: 'comment-block' },
        { match: '\\*/', pop: true },
      ],
    },
    'comment-doc': {
      default: 'comment.doc',
      rules: [
        { match: '/\\*', push: 'comment-doc' },
        { match: '\\*/', pop: true },
      ],
    },
  },
}

export default dart
