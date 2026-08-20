import type { Grammar } from '../core/types'

/**
 * Elixir.
 *
 * Most of the grammar is about the two things Elixir overloads hardest:
 *
 * - Sigils. `~r/…/u`, `~w[…]a` and `~s{…}` accept eight delimiters, and a
 *   closer that depends on the opener would need a backreference, which the
 *   compiler rejects. So there is one state per delimiter family, and the four
 *   paired families nest the way Elixir itself nests them.
 * - `?`. It ends a predicate name (`valid?`) and it opens a codepoint literal
 *   (`?a`). Predicate and bang names are matched from their first letter, so
 *   they claim their own `?` before the codepoint rule is ever tried at it.
 *
 * Three smaller calls worth knowing about:
 *
 * - A lowercase name behind a module alias is a function, not a field, so
 *   `IO.puts "hi"` reads as a call without needing parentheses, while
 *   `item.sku` stays a member.
 * - `@moduledoc """…"""` is documentation rather than a string literal — the
 *   same call `python.ts` makes for a docstring.
 * - Every `{` pushes a state, so a map or a tuple inside `#{…}` cannot close
 *   the interpolation early.
 *
 * Ordinary locals and pattern variables deliberately match no rule and inherit
 * the block foreground. Elixir function heads are patterns rather than name
 * lists, so there is no honest way to pick the bindings out of one.
 */

/** Local, function and attribute names. Elixir identifiers are ASCII. */
const ID = '[a-z_]\\w*'

/** A name plus the `?`/`!` Elixir lets a function name end in. */
const NAME = `${ID}[?!]?`

/** The operators an atom may name, longest spelling of each shape first. */
const OPS = '\\{\\}|\\[\\]|\\.\\.\\.?|<>|<=|>=|[=!]==?|=~|\\+\\+?|--?|\\*\\*?|\\|\\||&&|[<>/|]'

/**
 * A sigil introducer. Lowercase sigils are a single letter; uppercase ones may
 * be several since Elixir 1.15 (`~JSON"…"`).
 *
 * The cap bounds how far each of the ten delimiter rules scans before it gives
 * up on a run of capitals that never reaches a delimiter. That is a constant
 * factor rather than a complexity class — an uncapped `[A-Z]+` is still linear,
 * because each `~` only ever sees its own run — but it is worth up to 2.4x on
 * Node and 3.7x on Bun over capital-heavy input. Six letters is past every
 * sigil anyone ships.
 */
const SIGIL = '~(?:[A-Z]{1,6}|[a-z])'

const elixir: Grammar = {
  name: 'elixir',
  aliases: ['ex', 'exs'],
  states: {
    root: {
      rules: [
        // `#{` only interpolates inside a literal; in code a `#` always opens a
        // comment, so this rule comes first and needs no guard.
        { match: '#[^\\n]*', scope: 'comment' },

        // ---- documentation and module attributes ---------------------------
        {
          match: '(@(?:module|type|short)?doc)([ \\t]*)(""")',
          scope: ['decorator', null, 'comment.doc'],
          push: 'doc-heredoc',
        },
        // `@spec`, `@behaviour` and `@timeout` all read as annotations here.
        // A plain `@timeout` is really a compile-time constant, but splitting
        // the two would mean shipping a list of the attributes Elixir defines.
        { match: `@${ID}`, scope: 'decorator' },

        // ---- heredocs, sigils and strings ----------------------------------
        // Heredocs before their one-character openers, and sigil heredocs
        // before sigil strings, so `~S"""` is not read as `~S"` plus `""`.
        {
          match: `(${SIGIL})(""")`,
          scope: ['string.special', 'string'],
          push: 'heredoc-double',
        },
        {
          match: `(${SIGIL})(''')`,
          scope: ['string.special', 'string'],
          push: 'heredoc-single',
        },
        { match: '"""', scope: 'string', push: 'heredoc-double' },
        { match: "'''", scope: 'string', push: 'heredoc-single' },

        // One state per closing delimiter. `~r` bodies are scoped `string`
        // rather than `regexp` for the same reason `ruby.ts` does it for `%r`:
        // telling them apart would double the state count for a colour most
        // themes give the sigil's introducer anyway.
        {
          match: `(${SIGIL})(\\()`,
          scope: ['string.special', 'string'],
          push: 'sigil-paren',
        },
        {
          match: `(${SIGIL})(\\[)`,
          scope: ['string.special', 'string'],
          push: 'sigil-bracket',
        },
        {
          match: `(${SIGIL})(\\{)`,
          scope: ['string.special', 'string'],
          push: 'sigil-brace',
        },
        {
          match: `(${SIGIL})(<)`,
          scope: ['string.special', 'string'],
          push: 'sigil-angle',
        },
        {
          match: `(${SIGIL})(/)`,
          scope: ['string.special', 'string'],
          push: 'sigil-slash',
        },
        {
          match: `(${SIGIL})(\\|)`,
          scope: ['string.special', 'string'],
          push: 'sigil-pipe',
        },
        {
          match: `(${SIGIL})(")`,
          scope: ['string.special', 'string'],
          push: 'string',
        },
        {
          match: `(${SIGIL})(')`,
          scope: ['string.special', 'string'],
          push: 'charlist',
        },

        { match: '"', scope: 'string', push: 'string' },
        // A charlist. `~c"…"` is the modern spelling and shares the state.
        { match: "'", scope: 'string', push: 'charlist' },

        // ---- atoms ---------------------------------------------------------
        // The scan stops at the closing quote or the line break, so a stray
        // `:"` costs one line rather than the rest of the file.
        { match: ':"(?:[^"\\\\\\n]|\\\\.)*"', scope: 'constant' },
        // A name has to follow the colon, which keeps `::` and the `:` of a
        // keyword list out. The vocabulary has no atom scope, so it borrows
        // `constant` — the literal colour, which is where atoms usually land.
        { match: ':[A-Za-z_]\\w*[?!]?', scope: 'constant' },
        // An operator atom, which AST code is full of: `{:+, [], [1, 2]}`,
        // `[:<>, :{}]`. `ruby.ts` spells the same case the same way. The
        // trailing lookahead is what keeps a keyword-list value out — in
        // `[limit: -1]` the `:-` is a delimiter and a minus sign, and only a
        // real atom is followed straight by whitespace or a closer. `&` and `!`
        // are left out for the same reason: `[by: &fun/1]` keeps its capture.
        { match: `:(?:${OPS})(?=[\\s,)\\]}])`, scope: 'constant' },

        // A keyword-list key: `do:`, `parts: 3`, `name: "x"`. Ahead of the
        // keyword rules so `do:` is a key rather than a block opener, and it
        // requires no space before the colon so a typespec `sku :: t` is left
        // to the `::` operator. A quoted key (`"a b": 1`) stays a string.
        { match: `\\b${NAME}(?=:(?![:=]))`, scope: 'property' },

        // ---- keywords ------------------------------------------------------
        {
          match: '(\\b(?:defmodule|defprotocol|defimpl)\\b)([ \\t]+)([A-Z]\\w*(?:\\.[A-Z]\\w*)*)',
          scope: ['keyword.declaration', null, 'namespace'],
        },
        {
          match: `(\\b(?:defp?|defmacrop?|defguardp?|defdelegate)\\b)([ \\t]+)(${NAME})`,
          scope: ['keyword.declaration', null, 'function'],
        },
        {
          match: '\\b(?:def(?:p|macrop?|guardp?|delegate|struct|exception|overridable|impl|protocol|module)?|fn)\\b',
          scope: 'keyword.declaration',
        },
        {
          match: '\\b(?:after|case|catch|cond|do|else|end|for|if|raise|receive|rescue|throw|try|unless|when|with)\\b',
          scope: 'keyword.control',
        },
        // `use` and `require` pull another module in, which reads the way an
        // import does even though only `import` really is one.
        {
          match: '\\b(?:alias|import|require|use)\\b',
          scope: 'keyword.import',
        },
        { match: '\\b(?:and|in|not|or)\\b', scope: 'keyword.operator' },
        {
          match: '\\b(?:quote|unquote|unquote_splicing|super)\\b',
          scope: 'keyword',
        },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnil\\b', scope: 'constant.builtin' },
        // `__MODULE__`, `__ENV__`, `__struct__`.
        { match: '\\b__\\w+__\\b', scope: 'variable.special' },

        // ---- captures ------------------------------------------------------
        // `&1` is the first argument of a capture, which is as close to a
        // parameter as anything in `&(&1.qty > 0)` gets.
        { match: '&\\d+', scope: 'variable.parameter' },
        // `&handle/2` — a local function reference. The arity is required, so
        // this cannot swallow the `&` of `a && b`.
        { match: `(&)(${NAME})(?=/\\d)`, scope: ['operator', 'function.call'] },

        // ---- builtins ------------------------------------------------------
        // Ahead of the call rules so `is_map(x)` keeps its builtin colour.
        // Every guard Kernel defines is spelled `is_*`, and `defguard` names
        // follow the convention, so the prefix is cheaper than the list and
        // colours a hand-written guard the same way. It does claim an ordinary
        // function that happens to be called `is_admin`.
        { match: '\\bis_[a-z_]+(?=\\()', scope: 'function.builtin' },
        {
          match:
            '\\b(?:abs|apply|byte_size|div|elem|hd|inspect|length|map_size|max|min|rem|round|self|send|spawn|tl|to_string|tuple_size)\\b',
          scope: 'function.builtin',
        },

        // ---- names ---------------------------------------------------------
        // A lowercase name behind a module alias is always a function in
        // Elixir — modules have no fields — so `IO.puts "hi"` is a call even
        // with no parentheses in sight.
        {
          match: `(\\b[A-Z]\\w*)(\\.)(${NAME})`,
          scope: ['namespace', 'punctuation', 'function.method'],
        },
        // `map.fetch(k)` and `&map.fetch/1` on a plain value.
        {
          match: `(\\.)(${NAME})(?=\\(|/\\d)`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${NAME})`, scope: ['punctuation', 'variable.member'] },

        // Elixir has no SCREAMING_CASE constants — module attributes fill that
        // role — so every CapWords name is a module alias, and the dot decides
        // whether it is being qualified or used as a value.
        { match: '\\b[A-Z]\\w*(?=\\.)', scope: 'namespace' },
        { match: '\\b[A-Z]\\w*', scope: 'type' },

        // A typespec spells its types as zero-arity calls, so the `binary()` of
        // `@spec parse(binary()) :: t()` reads as a call rather than as a type.
        // Telling them apart needs to know that `@spec` opened the line.
        { match: `\\b${NAME}(?=\\()`, scope: 'function.call' },
        // A parenthesis-free predicate or bang call: `changed?`, `save!`. The
        // lookahead keeps the `a!` of `a!=b` and the `x=~` of a match out.
        { match: `\\b${ID}[?!](?![=~])`, scope: 'function.call' },

        // ---- literals ------------------------------------------------------
        { match: '\\b0[xX][0-9a-fA-F_]+\\b', scope: 'number' },
        { match: '\\b0[bB][01_]+\\b', scope: 'number' },
        { match: '\\b0[oO][0-7_]+\\b', scope: 'number' },
        // Elixir requires a digit on both sides of the point, so `1..5` stays a
        // range rather than becoming a malformed float.
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d+)?\\b',
          scope: 'number',
        },
        // `?a`, `?\n`, `?\x41` — an integer codepoint, not a string. Elixir has
        // no ternary, and a predicate name starts further left and so is always
        // the earlier match, which leaves this rule only the real literals.
        {
          match: '\\?(?:\\\\x\\{?[0-9a-fA-F]+\\}?|\\\\.|[^\\s\\\\])',
          scope: 'number',
        },

        // ---- syntax --------------------------------------------------------
        // Every `{` pushes, so a map inside an interpolation cannot end it.
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        {
          match:
            '\\|\\|\\||&&&|<<<|>>>|\\^\\^\\^|~~~|\\+\\+\\+|---|\\|>|<-|->|=>|<>|<<|>>|\\.\\.\\.|\\.\\.|::|\\|\\||&&|\\+\\+|--|=~|[=!]==?|[<>]=?|\\\\\\\\|[-+*/^&|=!%]',
          scope: 'operator',
        },
        { match: '[()\\[\\]}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
        { match: '\\.', scope: 'punctuation' },
      ],
    },

    // ---- string bodies -------------------------------------------------------
    /** Shared by every interpolating literal: strings, charlists, heredocs, sigils. */
    'interp-body': {
      rules: [
        {
          match: '\\\\(?:x\\{[0-9a-fA-F]+\\}|x[0-9a-fA-F]{1,2}|u\\{[0-9a-fA-F]+\\}|u[0-9a-fA-F]{4}|.)',
          scope: 'string.escape',
        },
        { match: '#\\{', scope: 'interpolation', push: 'interpolation' },
      ],
    },

    /**
     * A `"` string, and also `~s"…"`. The trailing letters on the closer are a
     * sigil's modifiers; a plain string is never followed by a bare letter in
     * valid Elixir, so both spellings can share one state.
     */
    string: {
      default: 'string',
      rules: [
        { include: 'interp-body' },
        { match: '"[a-zA-Z]*', pop: true },
        // A single-line literal ends at the line break rather than swallowing
        // the rest of the file. That gives up on the `~s"…"` spelling of a
        // multi-line string, which real code writes as a heredoc anyway.
        { match: '$', pop: true },
      ],
    },
    charlist: {
      default: 'string',
      rules: [{ include: 'interp-body' }, { match: "'[a-zA-Z]*", pop: true }, { match: '$', pop: true }],
    },

    'heredoc-double': {
      default: 'string',
      rules: [{ match: '"""', pop: true }, { include: 'interp-body' }],
    },
    'heredoc-single': {
      default: 'string',
      rules: [{ match: "'''", pop: true }, { include: 'interp-body' }],
    },
    /** A `@doc` body reads as prose, so nothing inside it is picked apart. */
    'doc-heredoc': {
      default: 'comment.doc',
      rules: [{ match: '"""', pop: true }],
    },

    // ---- sigils --------------------------------------------------------------
    // Uppercase sigils do not interpolate, but they share these states with
    // their lowercase twins: a literal `#{` inside `~S(…)` is the price of six
    // states instead of twelve. The letters on the closer are the modifiers.
    'sigil-paren': {
      default: 'string',
      rules: [
        // Paired delimiters nest, so `~w(a (b))` closes on the outer paren.
        { match: '\\(', push: 'sigil-paren' },
        { match: '\\)[a-zA-Z]*', pop: true },
        { include: 'interp-body' },
      ],
    },
    'sigil-bracket': {
      default: 'string',
      rules: [
        { match: '\\[', push: 'sigil-bracket' },
        { match: '\\][a-zA-Z]*', pop: true },
        { include: 'interp-body' },
      ],
    },
    'sigil-brace': {
      default: 'string',
      rules: [{ match: '\\{', push: 'sigil-brace' }, { match: '\\}[a-zA-Z]*', pop: true }, { include: 'interp-body' }],
    },
    'sigil-angle': {
      default: 'string',
      rules: [{ match: '<', push: 'sigil-angle' }, { match: '>[a-zA-Z]*', pop: true }, { include: 'interp-body' }],
    },
    'sigil-slash': {
      default: 'string',
      rules: [{ match: '/[a-zA-Z]*', pop: true }, { include: 'interp-body' }],
    },
    'sigil-pipe': {
      default: 'string',
      rules: [{ match: '\\|[a-zA-Z]*', pop: true }, { include: 'interp-body' }],
    },

    // ---- interpolation and braces --------------------------------------------
    interpolation: {
      rules: [{ match: '\\}', scope: 'interpolation', pop: true }, { include: 'root' }],
    },
    /** Tracks brace depth so a map or a tuple cannot close an interpolation. */
    brace: {
      rules: [{ match: '\\}', scope: 'punctuation.bracket', pop: true }, { include: 'root' }],
    },
  },
}

export default elixir
