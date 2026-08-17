import type { Grammar } from '../core/types'

/**
 * Kotlin.
 *
 * Four things here are worth knowing about:
 *
 * - String templates are expressions. `$name` and `${…}` are scoped as
 *   interpolations rather than string content, and the braced form tracks brace
 *   depth so a lambda inside it cannot end the literal early.
 * - Block comments nest in Kotlin, so they get a state instead of a lazy
 *   `[\s\S]*?` scan, which would stop at the first inner terminator.
 * - `@` is annotations, label definitions and label references at once. What
 *   sits in front of the `@` is what tells them apart.
 * - Backtick identifiers hold anything, spaces and keywords included, which is
 *   how most Kotlin test suites name their functions.
 *
 * The known wrong answer: soft keywords (`by`, `data`, `get`, `set`, `out`,
 * `where`) are scoped as keywords wherever they appear, so a parameter named
 * `by` reads as one. Telling the two apart needs to know where a declaration
 * begins and ends, which is a parser, not a state machine — and the reading is
 * right on ordinary code, where these words are used as keywords.
 */

// Kotlin identifiers permit unicode letters. An ASCII-only class splits
// `fun naïve()` into three runs and scopes the tail `function.call` — a call
// scope emitted at a definition site. The tail is capped for the same reason
// java.ts caps its own: a name rule with a lookahead must not rescan the line.
const ID = '[A-Za-z_\\u0080-\\uFFFF][A-Za-z0-9_\\u0080-\\uFFFF]{0,128}'

/** An identifier as it may be written at a declaration site, backticks and all. */
const NAME = `(?:\`[^\`\\n]*\`|${ID})`

const kotlin: Grammar = {
  name: 'kotlin',
  aliases: ['kt', 'kts'],
  states: {
    root: {
      rules: [
        { match: '//[^\\n]*', scope: 'comment' },
        // `/**` only opens KDoc when something follows it, so the empty comment
        // `/**` + `/` still reads as an ordinary block comment and closes.
        { match: '/\\*\\*(?![/*])', scope: 'comment.doc', push: 'doc-comment' },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },

        { match: '"""', scope: 'string', push: 'raw-string' },
        { match: '"', scope: 'string', push: 'string' },
        {
          match: "'(?:[^'\\\\\\n]|\\\\(?:u[0-9a-fA-F]{4}|.))'",
          scope: 'string',
        },

        // Only these five words can precede a label reference, and matching the
        // word here is what separates `return@loop` from the annotation `@loop`
        // — the same trick `javascript.ts` uses to avoid a lookbehind.
        {
          match: `(\\b(?:return|break|continue))(@)(${ID})`,
          scope: ['keyword.control', 'operator', 'variable.special'],
        },
        {
          match: `(\\b(?:this|super))(@)(${ID})`,
          scope: ['variable.builtin', 'operator', 'variable.special'],
        },
        { match: `@${ID}(?::${ID})?`, scope: 'decorator' },
        // A label definition (`outer@ for`) — the `@` is followed by the thing
        // being labelled, never by the label's own name.
        {
          match: `\\b(${ID})(@)(?=[\\s{])`,
          scope: ['variable.special', 'operator'],
        },

        // Declaration sites, before the bare keywords so `fun` claims the name
        // after it. The receiver of an extension function is scoped as a type;
        // a generic receiver (`fun List<T>.foo()`) falls through to the flat
        // rules instead, which still reads correctly, just without `foo` as a
        // definition.
        {
          match: `(fun)(\\s+)(?:<[^<>\\n]{0,80}>\\s*)?(?:(${ID})(\\.))?(${NAME})`,
          scope: ['keyword.declaration', null, 'type', 'punctuation', 'function'],
        },
        {
          match: `(\\b(?:class|interface|object))(\\s+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        // Binding a name: this is also what keeps `val count: Int` out of the
        // parameter rule below, which would otherwise claim every annotated
        // name. A SCREAMING_CASE name is left out on purpose so `const val
        // MAX = 1` still reads as a constant.
        {
          match: '(\\b(?:val|var))(\\s+)(`[^`\\n]*`|[a-z_]\\w*)',
          scope: ['keyword.declaration', null, 'variable'],
        },

        {
          match: '\\b(?:if|else|when|while|do|for|return|break|continue|throw|try|catch|finally)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:fun|val|var|class|interface|object|typealias|const(?:ructor)?|init|companion|enum|data|sealed|annotation|inner|open|override|abstract|final|private|protected|public|internal|lateinit|(?:no|cross)?inline|reified|vararg|suspend|operator|infix|actual|expect|by|where|get|set|out)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:package|import)\\b', scope: 'keyword.import' },
        // `as?` cannot use a trailing `\b`: the boundary after `?` needs a word
        // character next, and a cast is followed by a space.
        { match: '\\bas\\?|\\b(?:as|in|is)\\b', scope: 'keyword.operator' },

        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnull\\b', scope: 'constant.builtin' },
        { match: '\\b(?:this|super|it)\\b', scope: 'variable.builtin' },

        {
          match:
            '\\b(?:Int|Long|Short|Byte|Double|Float|Char|Boolean|String|Unit|Any|Nothing|Array|Pair|(?:Mutable)?(?:List|Map|Set)|Sequence)\\b',
          scope: 'type.builtin',
        },
        // Scope functions keep their identity through the dot; the member rule
        // below would otherwise call them methods of whatever they are chained to.
        {
          match: '(\\?\\.|\\.)(let|run|apply|also|takeIf|takeUnless|use)\\b',
          scope: ['punctuation', 'function.builtin'],
        },
        {
          match:
            '\\b(?:print(?:ln)?|readLine|arrayOf|(?:mutableL|l)istOf|(?:mutableM|m)apOf|(?:mutableS|s)etOf|emptyList|buildString|require|check|error|TODO|repeat|lazy|with)\\b(?=\\s*[({<])',
          scope: 'function.builtin',
        },

        // A capitalised member is an enum entry, a nested type or a companion
        // constant — never a method, since Kotlin methods are lowercase.
        {
          match: '(\\?\\.|\\.)([A-Z][A-Z0-9_]+)\\b',
          scope: ['punctuation', 'constant'],
        },
        { match: '(\\?\\.|\\.)([A-Z]\\w*)', scope: ['punctuation', 'type'] },

        // A trailing lambda is a call too, so `list.map { … }` scopes `map` the
        // same way `list.map(f)` does.
        {
          match: `(\\?\\.|\\.)(${ID})(?=\\s*[({])`,
          scope: ['punctuation', 'function.method'],
        },
        {
          match: `(\\?\\.|\\.)(${ID})`,
          scope: ['punctuation', 'variable.member'],
        },

        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },
        // A name glued to a `:` is being annotated. In a signature that is a
        // parameter, which is the common case; a local `val x: Int` is caught by
        // the `val`/`var` rule first, but a property in an interface body still
        // reads as a parameter.
        { match: `\\b${ID}(?=:)`, scope: 'variable.parameter' },
        { match: '\\b[a-z_]\\w*(?=\\s*[({])', scope: 'function.call' },
        { match: '`[^`\\n]*`', scope: 'variable' },

        // Kotlin has no octal literals, and `_` may separate any digits.
        { match: '\\b0[xX][0-9a-fA-F_]+[uU]?[lL]?\\b', scope: 'number' },
        { match: '\\b0[bB][01_]+[uU]?[lL]?\\b', scope: 'number' },
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d+)?[uU]?[lLfF]?\\b',
          scope: 'number',
        },

        // Longest first: `!!` before `!=`, `?.` before `?`, `->` before `-`.
        {
          match: '\\?[.:]|!!|\\+\\+|--|->|::|\\.\\.<?|&&|\\|\\||[!=]==?|[-+*/%<>]=?|[?=!&|]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    // ---- comments ----------------------------------------------------------
    // Two states rather than one, because the nesting has to preserve whether
    // the outermost comment was documentation.
    'block-comment': {
      default: 'comment',
      rules: [
        { match: '/\\*', push: 'block-comment' },
        { match: '\\*/', pop: true },
      ],
    },
    'doc-comment': {
      default: 'comment.doc',
      rules: [
        { match: '/\\*', push: 'doc-comment' },
        { match: '\\*/', pop: true },
      ],
    },

    // ---- strings -----------------------------------------------------------
    /** The template syntax both string forms share. */
    template: {
      rules: [
        // Only a bare identifier may follow `$`, so `"$item.sku"` interpolates
        // `item` and leaves `.sku` as text — which is what Kotlin does too.
        { match: `(\\$)(${ID})`, scope: ['interpolation', 'variable'] },
        { match: '\\$\\{', scope: 'interpolation', push: 'interpolation' },
      ],
    },

    string: {
      default: 'string',
      rules: [
        { match: '\\\\(?:u[0-9a-fA-F]{4}|.)', scope: 'string.escape' },
        { include: 'template' },
        { match: '"', scope: 'string', pop: true },
        // An unterminated string ends at the line break instead of swallowing
        // the rest of the file.
        { match: '$', pop: true },
      ],
    },

    /**
     * A raw string has no escapes, so a lone `"` or `""` is content. A run of
     * four or more quotes closes at the first three rather than the last, which
     * is the one case Kotlin's lexer reads the other way.
     */
    'raw-string': {
      default: 'string',
      rules: [{ include: 'template' }, { match: '"""', scope: 'string', pop: true }],
    },

    interpolation: {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'root' },
      ],
    },
    /** Brace depth, so a lambda or an object literal cannot close a template. */
    brace: {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'root' },
      ],
    },
  },
}

export default kotlin
