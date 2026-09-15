import type { Grammar } from '../core/types'

/**
 * Ruby.
 *
 * Ruby overloads more punctuation than most languages, so most of this grammar
 * is about telling the readings apart:
 *
 * - `/` opens a regex only after a token that cannot end an expression — the
 *   same guard `javascript.ts` uses — so `total / count` stays division.
 * - `?x` is a character literal, but the `?` of `empty?` is not: predicate and
 *   bang methods are matched from their first letter, so they claim their own
 *   `?` before the character-literal rule is ever tried at it.
 * - `<<` opens a heredoc only when what follows looks like a marker, and the
 *   body starts on the *next* line, so `sql = <<~SQL.strip` keeps the rest of
 *   the opening line highlighted as code.
 * - `%w[]`, `%i()` and `%q{}` get one state per delimiter. Matching the closer
 *   in a single pattern would need a backreference, which the compiler rejects.
 * - `{` always pushes a state, so a hash or a block inside `#{…}` cannot close
 *   the interpolation early.
 *
 * Ordinary locals deliberately match no rule and inherit the block foreground,
 * which is what keeps both the markup and the visual noise down.
 */

/** Local, method and parameter names. Non-ASCII identifiers render unscoped. */
const ID = '[A-Za-z_]\\w*'

/** The operators a method can be named after, longest form first. */
const OPS = '\\[\\]=?|<=>|===?|=~|<<|>>|\\*\\*|[<>]=?|[-+*/%&|^~]'

/** Everything `def` can name: `save!`, `[]=`, `<=>`, `!`. */
const METHOD = `(?:${ID}[?!=]?|${OPS}|![=~]?)`

/**
 * A `%`-literal introducer. The type letter is required: bare `%(…)` is legal
 * Ruby but far rarer than `x %(y)` is a typo for modulo, so `%` alone stays an
 * operator.
 */
const PCT = '%[qQwWiIrsx]'

/**
 * Operators after which a `/` opens a regex literal instead of dividing.
 * Openers (`(`, `[`, `{`) and keywords have rules of their own so they keep
 * their own scope.
 */
const BEFORE_REGEX = '(?:=~|!~|=>|&&|\\|\\||==|!=|[=,;|&!?:])'

/**
 * A regex body: no unescaped `/`, though a character class may hold one. The
 * leading guard keeps the `/=` operator and an empty `//` out.
 *
 * Both repetitions are capped. An uncapped `\[…*\]` scans to end of line
 * looking for a `]`, and because the rule is retried at every `,`/`(`/`[`
 * that precedes a `/`, a line of `,/[` costs O(n²) — 1.2 s for one 4 KB line,
 * which is a denial of service rather than a wrong colour. The caps bound that
 * scan; a regex literal or character class
 * longer than the cap simply is not recognised, which is the cheap failure.
 */
const REGEX = '/(?![/=])(?:[^/\\\\\\n\\[]|\\\\.|\\[(?:[^\\]\\\\\\n]|\\\\.){0,120}\\]){1,400}/[imxounse]*'

const ruby: Grammar = {
  name: 'ruby',
  aliases: ['rb', 'gemspec', 'rake'],
  states: {
    root: {
      rules: [
        // `=begin` opens a block comment only at column 0, which is also the
        // only place Ruby accepts it.
        { match: '^=begin', scope: 'comment', push: 'block-comment' },
        { match: '#[^\\n]*', scope: 'comment' },

        // A character literal is a `?` glued to one character. Predicate names
        // (`empty?`) start earlier in the line and are matched first, so what
        // is left here really is a literal — except for a ternary written with
        // no space after the `?`, which Ruby itself reads this way too.
        { match: '\\?(?:\\\\\\w|[^\\s\\\\])(?![\\w?!])', scope: 'string' },

        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: '`', scope: 'string', push: 'command' },

        // One state per closing delimiter, each tracking its own nesting so
        // `%r{\\d{2}}` and `%w[a [b]]` close where they should. A `%r` body is
        // scoped as a string: `regexp` is reserved for `/…/`, which is what
        // reads as a pattern at a glance.
        {
          match: `(${PCT})(\\[)`,
          scope: ['string.special', 'string'],
          push: 'pct-bracket',
        },
        {
          match: `(${PCT})(\\{)`,
          scope: ['string.special', 'string'],
          push: 'pct-brace',
        },
        {
          match: `(${PCT})(\\()`,
          scope: ['string.special', 'string'],
          push: 'pct-paren',
        },

        // Heredocs. The marker is not remembered — that needs a backreference —
        // so the body ends at the first line holding only a bare word.
        {
          match: '(<<[-~]?)([\'"])(\\w+)([\'"])',
          scope: ['operator', 'string', 'string.special', 'string'],
          push: 'heredoc-line',
        },
        {
          match: '(<<[-~])(\\w+)',
          scope: ['operator', 'string.special'],
          push: 'heredoc-line',
        },
        // Undecorated `<<` has to look like a marker, or `items << other` would
        // swallow the rest of the file.
        {
          match: '(<<)([A-Z_]\\w*)',
          scope: ['operator', 'string.special'],
          push: 'heredoc-line',
        },

        // The token before the `/` is matched and scoped here, which is cheaper
        // and more portable than a lookbehind. Three rules, because that token
        // needs its own scope: `split(/,/)` opens with a bracket, `when /x/`
        // with a keyword, `line =~ /x/` with an operator.
        // `{` is split out so it can still push `brace`. Consuming it here
        // without pushing breaks the invariant the `brace` state exists for —
        // `"#{xs.select { /a/ }.join}"` would let the *block's* `}` close the
        // interpolation, and every boundary after it shifts.
        {
          match: `([(\\[])([ \\t]*)(${REGEX})`,
          scope: ['punctuation.bracket', null, 'regexp'],
        },
        {
          match: `(\\{)([ \\t]*)(${REGEX})`,
          scope: ['punctuation.bracket', null, 'regexp'],
          push: 'brace',
        },
        {
          match: `(\\b(?:when|if|elsif|unless|while|until|case|return|then)\\b)([ \\t]*)(${REGEX})`,
          scope: ['keyword.control', null, 'regexp'],
        },
        {
          match: `(${BEFORE_REGEX})([ \\t]*)(${REGEX})`,
          scope: ['operator', null, 'regexp'],
        },

        // A symbol needs a name or an operator right after the colon, which
        // keeps both `::` and the `: b` of a ternary out. The vocabulary has no
        // symbol scope, so it borrows `constant` — the literal colour, next to
        // numbers, which is where most Ruby themes put symbols anyway.
        { match: `:(?:${ID}[?!=]?|${OPS})`, scope: 'constant' },

        { match: `@@?${ID}`, scope: 'variable' },
        { match: `\\$(?:${ID}|[0-9!@&*$?:~])`, scope: 'variable' },

        // Block parameters: `each do |item|` and `map { |k, v| }`.
        {
          match: '(\\bdo)([ \\t]*)(\\|)',
          scope: ['keyword.control', null, 'punctuation.delimiter'],
          push: 'do-params',
        },
        {
          match: '(\\{)([ \\t]*)(\\|)',
          scope: ['punctuation.bracket', null, 'punctuation.delimiter'],
          push: 'brace-params',
        },

        // The name is scoped in a state of its own so `def <=>` and `def []=`
        // work without listing every operator twice.
        { match: '\\bdef\\b', scope: 'keyword.declaration', push: 'def' },
        {
          match: '(\\bclass)([ \\t]+)([A-Z]\\w*(?:::[A-Z]\\w*)*)',
          scope: ['keyword.declaration', null, 'class'],
        },
        {
          match: '(\\bmodule)([ \\t]+)([A-Z]\\w*(?:::[A-Z]\\w*)*)',
          scope: ['keyword.declaration', null, 'namespace'],
        },

        // A label: `key: value`, `def f(name:)`. Before the keyword rules so
        // `{ if: true }` reads as a hash key, and requiring no space before the
        // colon so `cond ? a : b` is left alone.
        { match: `\\b${ID}(?=:(?![:=]))`, scope: 'property' },

        {
          match:
            '\\b(?:if|elsif|else|unless|case|when|while|until|for|break|next|redo|retry|return|yield|begin|rescue|ensure|end|do|then)\\b',
          scope: 'keyword.control',
        },
        {
          match: '\\b(?:def|class|module|alias|undef|private|public|protected|module_function)\\b',
          scope: 'keyword.declaration',
        },
        // `include` and `extend` pull another module's methods in, which reads
        // the same way an import does.
        {
          match: '\\b(?:require|require_relative|load|autoload|include|extend|prepend|using)\\b',
          scope: 'keyword.import',
        },
        // `\b` cannot terminate `defined?`: `?` is not a word character, so the
        // boundary would fall in the wrong place. Same for the builtins below.
        {
          match: '\\b(?:and|or|not|in|defined\\?)(?![\\w?!])',
          scope: 'keyword.operator',
        },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnil\\b', scope: 'constant.builtin' },
        { match: '\\b(?:self|super)\\b', scope: 'variable.builtin' },
        {
          match: '\\b__(?:FILE|LINE|ENCODING|dir|method)__\\b',
          scope: 'variable.special',
        },

        {
          match:
            '\\b(?:puts|pp|print|raise|fail|abort|loop|lambda|proc|format|sprintf|gets|exit|freeze|attr_accessor|attr_reader|attr_writer|define_method|block_given\\?)(?![\\w?!])',
          scope: 'function.builtin',
        },

        // A method with a block is still a call, so `.each do |x|` and
        // `.map { }` count alongside `.push(x)`.
        {
          match: `(&?\\.)([ \\t]*)(${ID}[?!]?)(?=[ \\t]*(?:\\(|\\{|do\\b))`,
          scope: ['punctuation', null, 'function.method'],
        },
        // A `?` or `!` suffix only ever ends a method name.
        {
          match: `(&?\\.)([ \\t]*)(${ID}[?!])`,
          scope: ['punctuation', null, 'function.method'],
        },
        {
          match: `(&?\\.)([ \\t]*)(${ID})`,
          scope: ['punctuation', null, 'variable.member'],
        },

        { match: '\\b[A-Z]\\w*(?=::)', scope: 'namespace' },
        // SCREAMING_CASE reads as a constant, CapWords as a type — between them
        // that covers module constants, classes and the exception hierarchy
        // without shipping a name list.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z]\\w*', scope: 'type' },

        { match: '\\b[a-z_]\\w*[?!]?(?=\\()', scope: 'function.call' },
        // A parenthesis-free predicate or bang call: `valid?`, `save!`. The
        // lookahead is what keeps the `a!` of `a!=b` out of it.
        { match: '\\b[a-z_]\\w*[?!](?![=~\\w?!])', scope: 'function.call' },

        { match: '\\b0[xX][0-9a-fA-F_]+\\b', scope: 'number' },
        { match: '\\b0[bB][01_]+\\b', scope: 'number' },
        { match: '\\b0[oO]?[0-7_]+\\b', scope: 'number' },
        // `r` and `i` are the rational and imaginary suffixes.
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d+)?[ri]?\\b',
          scope: 'number',
        },

        // Every `{` pushes, so `}` always closes the thing that opened it.
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        {
          match: '<=>|=~|!~|\\.\\.\\.?|::|=>|\\*\\*=?|\\|\\|=?|&&=?|<<=?|>>=?|[-+*/%^&|]=?|[<>!=]=?=?|[?~]',
          scope: 'operator',
        },
        { match: '[()\\[\\]}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    'block-comment': {
      default: 'comment',
      rules: [{ match: '^=end[^\\n]*', pop: true }],
    },

    // ---- strings -----------------------------------------------------------
    /** Shared by every interpolating literal: strings, commands, heredocs, `%` literals. */
    'interp-body': {
      rules: [
        {
          match: '\\\\(?:u\\{[0-9a-fA-F ]+\\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2}|[0-7]{1,3}|.)',
          scope: 'string.escape',
        },
        { match: '#\\{', scope: 'interpolation', push: 'interpolation' },
      ],
    },

    'string-double': {
      default: 'string',
      // No rule pops at the line break: a Ruby string really does span lines.
      rules: [{ include: 'interp-body' }, { match: '"', pop: true }],
    },
    'string-single': {
      default: 'string',
      rules: [
        { match: "\\\\['\\\\]", scope: 'string.escape' },
        { match: "'", pop: true },
      ],
    },
    command: {
      default: 'string',
      rules: [{ include: 'interp-body' }, { match: '`', pop: true }],
    },

    // `%q{…}` and `%w[…]` do not interpolate, but they share these states with
    // `%Q{…}` and `%W[…]`, which do. A literal `#{` inside a non-interpolating
    // `%` literal is the price of three states instead of six. The trailing
    // letters on the closer are `%r`'s flags; nothing else can follow one.
    'pct-bracket': {
      default: 'string',
      rules: [
        { match: '\\[', push: 'pct-bracket' },
        { match: '\\][imxounse]*', pop: true },
        { include: 'interp-body' },
      ],
    },
    'pct-brace': {
      default: 'string',
      rules: [{ match: '\\{', push: 'pct-brace' }, { match: '\\}[imxounse]*', pop: true }, { include: 'interp-body' }],
    },
    'pct-paren': {
      default: 'string',
      rules: [{ match: '\\(', push: 'pct-paren' }, { match: '\\)[imxounse]*', pop: true }, { include: 'interp-body' }],
    },

    /** The rest of the opening line is code; the heredoc body starts after it. */
    'heredoc-line': {
      rules: [{ match: '\\n', set: 'heredoc' }, { include: 'root' }],
    },
    heredoc: {
      default: 'string',
      rules: [{ match: `^[ \\t]*${ID}[ \\t]*$`, scope: 'string.special', pop: true }, { include: 'interp-body' }],
    },

    // ---- interpolation and braces ------------------------------------------
    interpolation: {
      rules: [{ match: '\\}', scope: 'interpolation', pop: true }, { include: 'root' }],
    },
    /** Tracks brace depth so a hash or a block cannot close an interpolation. */
    brace: {
      rules: [{ match: '\\}', scope: 'punctuation.bracket', pop: true }, { include: 'root' }],
    },

    // ---- parameters --------------------------------------------------------
    /** Entered on `def`, left as soon as the method name has been scoped. */
    def: {
      rules: [
        { match: '(self)(\\.)', scope: ['variable.builtin', 'punctuation'] },
        // A parenthesis-free signature: `def write path, mode`. The first name
        // has no delimiter in front of it for `params` to hang off, so it is
        // taken here, with the rest of the list.
        {
          match: `(${METHOD})([ \\t]+)(${ID})`,
          scope: ['function', null, 'variable.parameter'],
          set: 'params',
        },
        { match: METHOD, scope: 'function', set: 'params' },
        { match: '$', pop: true },
      ],
    },
    /**
     * A signature. Only a name introduced by `(` or `,` becomes a parameter, so
     * a default value is not mistaken for one. A call inside a default value
     * (`def f(a = g(1))`) ends the signature at the inner `)`, which costs the
     * parameters after it their scope.
     */
    params: {
      rules: [
        {
          match: `(\\()(\\s*)([&*]{0,2})(${ID})`,
          scope: ['punctuation.bracket', null, 'operator', 'variable.parameter'],
        },
        {
          match: `(,)(\\s*)([&*]{0,2})(${ID})`,
          scope: ['punctuation.delimiter', null, 'operator', 'variable.parameter'],
        },
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        // A signature ends at the line break unless the line is continued.
        { match: '(?<![,(\\\\])$', pop: true },
        { include: 'root' },
      ],
    },

    'do-params': {
      rules: [{ match: '\\|', scope: 'punctuation.delimiter', pop: true }, { include: 'block-params' }],
    },
    /** The closing `|` hands over to `brace`, so the block's `}` still pops. */
    'brace-params': {
      rules: [{ match: '\\|', scope: 'punctuation.delimiter', set: 'brace' }, { include: 'block-params' }],
    },
    'block-params': {
      rules: [
        { match: ID, scope: 'variable.parameter' },
        { match: '[(),]', scope: 'punctuation.delimiter' },
        { match: '[&*]', scope: 'operator' },
        // An unclosed `|` list should not eat the file.
        { match: '$', pop: true },
      ],
    },
  },
}

export default ruby
