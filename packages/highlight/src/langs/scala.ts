import type { Grammar } from '../core/types'

/**
 * Scala 2 and 3.
 *
 * The parts most highlighters flatten into one colour, and that this grammar
 * keeps apart:
 *
 * - an interpolated literal is an expression. `s"…"`, `f"…"` and any custom
 *   interpolator scope their prefix apart from the quotes, `$name` and `${…}`
 *   read as interpolations, and the braced form tracks brace depth so a lambda
 *   inside it cannot end the literal early.
 * - `case class` declares a type while every other `case` opens a match branch,
 *   so the two are scoped differently.
 * - block comments nest in Scala, so they get a state rather than a lazy
 *   `[\s\S]*?` scan, which would stop at the first inner terminator.
 * - operators are user-definable, so they are matched as a run of operator
 *   characters instead of a fixed list — which is also how `+:`, `<:`, `:::`
 *   and `?=>` all come out as single tokens without enumerating them.
 * - a symbol literal (`'name`) is told from a char literal (`'a'`), the same
 *   way Rust tells a lifetime from one.
 *
 * The known wrong answers:
 *
 * - Scala 3's soft keywords (`extension`, `using`, `derives`, `opaque`,
 *   `infix`, `open`) are scoped as keywords wherever they appear, so a value
 *   named `extension` reads as one. Telling them apart needs to know where a
 *   declaration begins, which is a parser, not a state machine.
 * - a name glued to a `:` reads as a parameter, which is right in a signature
 *   and wrong for the name a `given` binds.
 * - `%s`-style format specifiers are scoped inside every interpolated literal,
 *   not just `f"…"`, because the state does not carry which interpolator
 *   opened it. In an `s"…"` a literal `%d` therefore reads as a spec.
 * - `end` is left alone. Scala 3's end markers would need it as a keyword, and
 *   `end` is far too common a name to spend that on.
 *
 * Ordinary identifiers — locals, fields, receivers — deliberately match no rule
 * and inherit the block's foreground, which keeps the markup small.
 */

/**
 * Everything an identifier may continue with, length-capped.
 *
 * The cap is what keeps the rules that match a name and then test a lookahead
 * from rescanning the line at every column; names this long do not occur in
 * real code. Shared by every rule that spells out a name, because a rule that
 * quietly drops the non-ASCII range splits `naïve` after `na` and leaves the
 * rest of the identifier unscoped.
 */
const IDTAIL = '[A-Za-z0-9_\\u0080-\\uFFFF]{0,128}'

/** A Scala identifier. Unicode letters are allowed because Scala allows them. */
const ID = `[A-Za-z_\\u0080-\\uFFFF]${IDTAIL}`

/** An identifier as it may be written at a declaration site, backticks and all. */
const NAME = `(?:\`[^\`\\n]*\`|${ID})`

/**
 * One operator character. `/` is handled separately everywhere this is used:
 * a `/` followed by `/` or `*` opens a comment and must not be swallowed into
 * the operator run before the comment rules ever get a look.
 */
const OP = '(?:[!#%&*+\\-:<=>?@^|~]|/(?![/*]))'

/** `\n`, `\"`, `\\`, `\u2014`. Scala has no line continuation inside a literal. */
const ESCAPE = '\\\\(?:u[0-9a-fA-F]{4}|.)'

/**
 * `java.util.Formatter` specs as `f"…"` uses them: `%s`, `%-20s`, `%.2f`, `%n`.
 * The space flag is deliberately left out so ordinary prose — `s"50% off"` —
 * does not read as a spec.
 */
const FORMAT = '%[-#+0,(]{0,6}\\d{0,6}(?:\\.\\d{1,6})?[sSdxXeEfgGn%]'

const scala: Grammar = {
  name: 'scala',
  aliases: ['sc', 'sbt'],
  states: {
    root: {
      rules: [
        { match: '//[^\\n]*', scope: 'comment' },
        // `/**` only opens Scaladoc when something follows it, so the half-typed
        // `/**` + `/` still reads as an ordinary block comment and closes.
        { match: '/\\*\\*(?![/*])', scope: 'comment.doc', push: 'doc-comment' },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },

        // An interpolator is an identifier glued to the quote, and any
        // identifier may be one. The prefix is scoped apart from the literal so
        // it reads as a modifier on it. Longest opener first: `s"""` has to
        // beat `s"` + an empty string.
        {
          match: `\\b(${ID})(""")`,
          scope: ['string.special', 'string'],
          push: 'interp-triple',
        },
        // `raw"…"` interpolates but leaves escapes alone, so it gets a state of
        // its own rather than sharing the one that scopes them. It sits below
        // the triple-quote rule so `raw"""…"""` still opens a triple literal.
        {
          match: '\\b(raw)(")',
          scope: ['string.special', 'string'],
          push: 'interp-raw',
        },
        {
          match: `\\b(${ID})(")`,
          scope: ['string.special', 'string'],
          push: 'interp-string',
        },
        { match: '"""', scope: 'string', push: 'triple-string' },
        { match: '"', scope: 'string', push: 'string' },

        // A char literal always closes; a symbol literal never does.
        { match: `'(?:[^'\\\\\\n]|${ESCAPE})'`, scope: 'string' },
        { match: "'[A-Za-z_]\\w{0,128}", scope: 'string.special' },

        // The whole dotted path in one rule — Scala has no marker like Rust's
        // `::` that would let a later rule recognise a package name on its own.
        // A selector block (`import a.b.{c, d}`) stops the path at `b`.
        {
          match: `\\b(import|package|export)([ \\t]+)((?:${ID}\\.)*(?:${ID}|\\*|_))`,
          scope: ['keyword.import', null, 'namespace'],
        },
        { match: '\\b(?:import|package|export)\\b', scope: 'keyword.import' },

        // A pattern binder (`case x@Some(_)`) starts with the same character an
        // annotation does. Matching the name in front of the `@` is what tells
        // them apart — the same trick `kotlin.ts` uses for labels, and it keeps
        // a lookbehind out of a rule that is tried at every position.
        { match: `(\\b${ID})(@)`, scope: ['variable', 'operator'] },
        { match: `@${ID}(?:\\.${ID})*`, scope: 'decorator' },

        // Declaration sites, before the bare keywords so each claims the name
        // after it. A `def` may be named with an operator (`def +:(…)`), which
        // is why the name alternation is wider here than anywhere else.
        {
          match: `(\\bdef)([ \\t]+)(${NAME}|${OP}{1,16})`,
          scope: ['keyword.declaration', null, 'function'],
        },
        {
          match: `(\\b(?:class|trait|object|enum))([ \\t]+)(${NAME})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        {
          match: `(\\btype)([ \\t]+)(${NAME})`,
          scope: ['keyword.declaration', null, 'type'],
        },
        // Scala names constants in CapWords, so a bound name that starts with a
        // capital is a constant rather than a type — but only when the name is
        // followed straight by `:` or `=`, which is what keeps the destructuring
        // `val Some(x) = opt` reading as the extractor it is.
        {
          match: `(\\b(?:val|var))([ \\t]+)([A-Z]${IDTAIL})(?=[ \\t]*[:=])`,
          scope: ['keyword.declaration', null, 'constant'],
        },
        // The start of the name stays lowercase-or-underscore — widening it to
        // every letter would claim the `Some` of `val Some(x) = opt`, which is
        // an extractor and not a bound name. Non-ASCII initials land here
        // rather than in the constant rule above, which is the right reading
        // for a `val` either way.
        {
          match: `(\\b(?:val|var))([ \\t]+)(\`[^\`\\n]*\`|[a-z_\\u0080-\\uFFFF]${IDTAIL})`,
          scope: ['keyword.declaration', null, 'variable'],
        },
        // `case class` and `case object` declare a type; every other `case`
        // opens a match branch or names an enum member.
        {
          match: '\\bcase(?=[ \\t]+(?:class|object)\\b)',
          scope: 'keyword.declaration',
        },

        {
          match: '\\b(?:if|else|then|match|case|for|while|do|yield|try|catch|finally|throw|return)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:def|val|var|class|trait|object|enum|type|given|using|extension|implicit|lazy|sealed|abstract|final|override|private|protected|extends|with|derives|opaque|inline|transparent|infix|open)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\bnew\\b', scope: 'keyword.operator' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        // `Nil` and `None` are values, not types, so they are scoped before the
        // CapWords rule below would call them types.
        { match: '\\b(?:null|None|Nil)\\b', scope: 'constant.builtin' },
        { match: '\\b(?:this|super)\\b', scope: 'variable.builtin' },

        {
          match:
            '\\b(?:Int|Long|Short|Byte|Char|Float|Double|Boolean|Unit|String|Any(?:Ref|Val)?|Nothing|Null|Option|Some|Either|Left|Right|List|Seq|Vector|Array|Set|Map|Future|Try|Success|Failure)\\b',
          scope: 'type.builtin',
        },
        {
          match: '\\b(?:print(?:ln|f)?|require|assert|implicitly|summon)\\b',
          scope: 'function.builtin',
        },

        // Matched at the dot, so `logger.map` never reads as a bare name. A
        // capitalised member is an enum case, a nested type or a companion
        // constant — never a method, since Scala methods are lowercase.
        {
          match: '(\\.)([A-Z][A-Z0-9_]{0,128})\\b',
          scope: ['punctuation', 'constant'],
        },
        {
          match: '(\\.)([A-Z][A-Za-z0-9_]{0,128})',
          scope: ['punctuation', 'type'],
        },
        // A trailing block is a call too, so `xs.map { … }` scopes `map` the
        // same way `xs.map(f)` does.
        {
          match: `(\\.)(${ID})(?=[ \\t]*[({])`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },

        // SCREAMING_CASE reads as a constant and CapWords as a type. Between
        // them they cover classes, traits, enum cases, type parameters and the
        // whole exception hierarchy without shipping a name list.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },
        // A name glued to a `:` is being ascribed a type, which in a signature
        // means a parameter. The colon has to be glued on: `xs :: ys` puts a
        // list cons where the ascription would be, and it is far more common.
        { match: `\\b${ID}(?=:(?![:=]))`, scope: 'variable.parameter' },
        { match: `\\b[a-z_]${IDTAIL}(?=[ \\t]*[({])`, scope: 'function.call' },
        { match: '`[^`\\n]*`', scope: 'variable' },

        // Scala has no binary literals. Underscore separators are accepted
        // wherever digits are, so a literal pasted from Java-flavoured code
        // still reads as a number.
        { match: '\\b0[xX][0-9a-fA-F][0-9a-fA-F_]*[lL]?\\b', scope: 'number' },
        // A digit is required after the point so `1.to(10)` keeps its method
        // call instead of ending the literal at the dot.
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d+)?[fFdDlL]?\\b',
          scope: 'number',
        },

        // A lone `:` delimits an ascription; a `:` in a run of operator
        // characters (`::`, `<:`, `:+`) belongs to the operator.
        { match: ':(?![!#%&*+\\-/:<=>?@^|~])', scope: 'punctuation.delimiter' },
        { match: `${OP}+`, scope: 'operator' },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;]', scope: 'punctuation.delimiter' },
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
    /** The interpolation syntax both interpolated forms share. */
    'interp-body': {
      rules: [
        // `$$` is how an interpolated literal writes a dollar sign.
        { match: '\\$\\$', scope: 'string.escape' },
        { match: '\\$\\{', scope: 'interpolation', push: 'interpolation' },
        // Only a bare identifier may follow `$`, so `s"$item.sku"` interpolates
        // `item` and leaves `.sku` as text — which is what Scala does too.
        { match: `(\\$)(${ID})`, scope: ['interpolation', 'variable'] },
        { match: FORMAT, scope: 'string.special' },
      ],
    },

    string: {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
        // A single-quoted Scala literal cannot span a line, so an unterminated
        // one ends at the line break instead of swallowing the rest of the file.
        { match: '$', pop: true },
      ],
    },

    'interp-string': {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { include: 'interp-body' },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },

    'interp-raw': {
      default: 'string',
      rules: [{ include: 'interp-body' }, { match: '"', scope: 'string', pop: true }, { match: '$', pop: true }],
    },

    /**
     * A triple-quoted literal has no escapes at all — `\n` in one is a
     * backslash and an `n` — and ends only on `"""`, so a quote or a `//`
     * inside it is text.
     */
    'triple-string': {
      default: 'string',
      rules: [{ match: '"""', scope: 'string', pop: true }],
    },
    'interp-triple': {
      default: 'string',
      rules: [{ include: 'interp-body' }, { match: '"""', scope: 'string', pop: true }],
    },

    interpolation: {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'root' },
      ],
    },
    /** Brace depth, so a lambda or a block cannot close the interpolation. */
    brace: {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'root' },
      ],
    },
  },
}

export default scala
