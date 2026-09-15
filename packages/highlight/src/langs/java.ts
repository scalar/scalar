import type { Grammar } from '../core/types'

/**
 * Java.
 *
 * The parts most highlighters flatten into one colour, and that this grammar
 * keeps apart:
 *
 * - a method *declaration* is told from a *call* by what sits in front of it.
 *   A declaration always follows a type, so `void run()` and `Order(int id)`
 *   are definitions while `run()`, `o.run()` and `return run()` are calls
 * - text blocks (`"""`) are a state, so a `"` or a `//` inside one is text
 * - `%s`-style format specifiers stand out inside a literal, which is as close
 *   as Java gets to interpolation
 * - `@interface` declares a type; every other `@Name` is an annotation
 *
 * Ordinary identifiers — locals, fields, parameters — deliberately match no
 * rule and inherit the block's foreground, which keeps the markup small.
 */

/**
 * A Java identifier, with its tail length-capped.
 *
 * `$` is legal in an identifier but is not a `\w` character, so `\b` sits
 * between every `$` and the letter after it. In `$a$a$a…` — one identifier —
 * that is a word boundary every two characters, and the rules that match a name
 * and then test a lookahead would restart at each one and rescan the line. The
 * cap bounds that scan; names this long do not occur in real code.
 */
const ID = '[A-Za-z_$\\u0080-\\uFFFF][\\w$\\u0080-\\uFFFF]{0,128}'

/**
 * `\n`, `\"`, `\\`, `•`, `\uu2022` (legal), `\033`.
 *
 * No line-continuation alternative: Java has none, and accepting one lets a
 * string ending in a backslash swallow the following line of code.
 */
const ESCAPE = '\\\\(?:u+[0-9a-fA-F]{4}|[0-7]{1,3}|.)'

/** `java.util.Formatter` specs: `%s`, `%-8s`, `%,.2f`, `%08X`, `%2$tY`, `%n`. */
const FORMAT = '%(?:\\d{1,3}\\$)?[-#+ 0,(]{0,6}\\d{0,6}(?:\\.\\d{1,6})?[bBhHsScCdoxXeEfgGaAtTn%]'

const java: Grammar = {
  name: 'java',
  states: {
    root: {
      rules: [
        // Block comments are states, not a lazy `[\s\S]*?\*/` scan. The lazy
        // form costs O(n²) when the closer is missing — a 128 KB file with an
        // unterminated `/*` took 24 s — and it mis-colours the half-typed
        // `/**` an editor sends on every keystroke, rendering the opener as an
        // operator and the prose as code.
        { match: '/\\*\\*(?![/*])', scope: 'comment.doc', push: 'doc-comment' },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },
        { match: '//[^\\n]*', scope: 'comment' },

        // Text blocks first: `"""` and `"` both start here, and the longer
        // opener has to win.
        { match: '"""', scope: 'string', push: 'text-block' },
        { match: '"', scope: 'string', push: 'string' },
        { match: `'(?:[^'\\\\\\n]|${ESCAPE})'`, scope: 'string' },

        // The whole dotted path in one rule. There is no marker like Rust's
        // `::` that would let a later rule recognise a package name on its own.
        {
          match: `\\b(import|package)([ \\t]+)(?:(static)([ \\t]+))?((?:${ID}\\.)*(?:${ID}|\\*))`,
          scope: ['keyword.import', null, 'keyword.declaration', null, 'namespace'],
        },
        { match: '\\b(?:import|package)\\b', scope: 'keyword.import' },

        // `@interface` declares an annotation type, so it is matched here
        // rather than left to the annotation rule below. The lookbehind is what
        // stops `subclass Foo` from reading as `class Foo`; a leading `\b`
        // cannot do it because `@` is not a word character.
        {
          match: `(?<![\\w$@])(@?(?:class|interface|enum|record)\\b)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        { match: `(@${ID}(?:\\.${ID})*)`, scope: 'decorator' },

        {
          match:
            '\\b(?:assert|break|case|catch|continue|default|do|else|finally|for|if|return|switch|throw|try|while|yield)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:abstract|class|const|enum|extends|final|implements|interface|native|non-sealed|permits|private|protected|public|sealed|static|strictfp|synchronized|throws|transient|var|volatile)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:instanceof|new)\\b', scope: 'keyword.operator' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnull\\b', scope: 'constant.builtin' },
        { match: '\\b(?:this|super)\\b', scope: 'variable.builtin' },
        {
          match:
            '\\b(?:boolean|byte|char|double|float|int|long|short|void|String|Object|Integer|Long|Double|Float|Short|Byte|Character|Boolean|Number|CharSequence|Class|Math|System|Exception|RuntimeException|Throwable|List|Map|Set|Optional|Stream)\\b',
          scope: 'type.builtin',
        },

        // Matched at the dot, so `logger.print` never reads as a bare name.
        {
          match: `(\\.)([ \\t]*)(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', null, 'function.method'],
        },
        {
          match: `(\\.)([ \\t]*)(${ID})`,
          scope: ['punctuation', null, 'variable.member'],
        },
        // A method reference names a method without calling it.
        {
          match: `(::)([ \\t]*)(${ID})`,
          scope: ['operator', null, 'function.method'],
        },

        // A declaration is a name that follows a type, which in Java always
        // ends in an identifier character, a `>` or a `]`: `int run(`,
        // `Money priceOf(`, `List<T> items(`, `String[] main(`. The exclusions
        // are the tokens that end the same way but introduce a *call*: `->` for
        // a lambda body, and the keywords that can sit directly before one.
        //
        // The reading it gets wrong: a `>` comparison against a call looks
        // exactly like a generic return type, so `if (a[i] > f(x))` and
        // `if (list.size() > max(a, b))` scope the call as a definition. A
        // subscript is safe — `if (xs[i]) run();` has a `)` before the space,
        // which the lookbehind class does not accept.
        {
          match: `(?<=[\\w$>\\]])(?<!->)(?<!\\b(?:return|new|throw|else|yield|assert|do))([ \\t]+)(${ID})(?=[ \\t]*\\()`,
          scope: [null, 'function'],
        },

        // SCREAMING_CASE reads as a constant — which also covers enum members —
        // and CapWords as a type. Between them they cover classes, interfaces
        // and the whole exception hierarchy without shipping a name list.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_$]*\\b', scope: 'type' },
        { match: `\\b${ID}(?=[ \\t]*->)`, scope: 'variable.parameter' },
        {
          match: '\\b[a-z_$][\\w$\\u0080-\\uFFFF]{0,128}(?=[ \\t]*\\()',
          scope: 'function.call',
        },

        { match: '\\b0[xX][0-9a-fA-F][0-9a-fA-F_]*[lL]?\\b', scope: 'number' },
        { match: '\\b0[bB][01][01_]*[lL]?\\b', scope: 'number' },
        // Octal (`0755`) needs no rule of its own: it is decimal-shaped and
        // both readings end up scoped `number` anyway.
        {
          match: '\\b\\d[\\d_]*(?:\\.[\\d_]*)?(?:[eE][-+]?\\d+)?[fFdDlL]?\\b|\\.\\d[\\d_]*(?:[eE][-+]?\\d+)?[fFdDlL]?',
          scope: 'number',
        },

        {
          match: '->|::|\\.{3}|\\+\\+|--|>>>?=?|<<=?|&&|\\|\\||[-+*/%&|^!=<>]=?|[~?]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    'string-body': {
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: FORMAT, scope: 'string.special' },
      ],
    },

    /**
     * Block comments. Java does not nest them — the first closer wins — so
     * these do not push themselves; they exist so an unterminated comment
     * costs one linear scan and still colours as a comment.
     */
    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', pop: true }],
    },

    'doc-comment': {
      default: 'comment.doc',
      rules: [{ match: '\\*/', pop: true }],
    },

    string: {
      default: 'string',
      rules: [
        { include: 'string-body' },
        { match: '"', scope: 'string', pop: true },
        // A Java string literal cannot span a line, so an unterminated one ends
        // at the line break instead of swallowing the rest of the file.
        { match: '$', pop: true },
      ],
    },

    /** A text block ends only on `"""`, so quotes and `//` inside it are text. */
    'text-block': {
      default: 'string',
      rules: [{ include: 'string-body' }, { match: '"""', scope: 'string', pop: true }],
    },
  },
}

export default java
