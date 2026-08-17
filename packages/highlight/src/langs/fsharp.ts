import type { Grammar } from '../core/types'

/**
 * F#.
 *
 * The apostrophe is the character that decides whether an F# highlighter is any
 * good: it opens a char literal (`'a'`), it prefixes a generic parameter
 * (`'T`), and it is a perfectly ordinary letter inside a name (`sum'`). Both
 * quote rules are guarded by a lookbehind so they only fire where a name cannot
 * already be running, which keeps `x' 'a'` from reading as one char literal.
 *
 * The other things worth knowing about:
 *
 * - Three string flavours with their own escaping rules — plain, verbatim
 *   (`@"…"`, where `""` is a quote) and triple-quoted (no escapes at all) —
 *   each with an interpolated `$` form on top. `%d`-style printf specifiers are
 *   scoped in all of them, because in F# they are typed and part of the API.
 * - `(*` opens a comment that nests, so it needs a state rather than a lazy
 *   `[\s\S]*?`. `(*)` is the multiplication operator and is matched first.
 * - A `let` binding is scoped as a value or as a function depending on what
 *   follows the name, which is as close as a regex gets to F#'s "everything is
 *   a function" story.
 * - ``double-backtick names`` are ordinary identifiers with spaces in them.
 */

/** An F# identifier. The trailing `'` is a normal letter here, as in `sum'`. */
const ID = "[A-Za-z_][\\w']*"

/** A binding name, including the ``quoted`` form that may hold anything but a backtick. */
const NAME = `(?:${ID}|\`\`[^\`\\n]*\`\`)`

/**
 * Modifiers that may sit between a binding keyword and the name it binds.
 * Captured as one run — including the spaces between them — so a single rule
 * covers `let rec inline`, `let private mutable` and `member val`.
 */
const MODS = '((?:(?:rec|inline|mutable|private|internal|public|static|member|val)[ \\t]+)*)'

/**
 * Blocks a rule from naming a modifier. Without it `let inline (+.) a b = …`
 * backtracks: the modifier run gives up its match so that `inline` itself can
 * satisfy the name the rule still needs.
 */
const NOT_MOD = '(?!(?:rec|inline|mutable|private|internal|public|static|member|val)\\b)'

/** `\n`, `©`, `\x41`, `\233` (the decimal trigraph) and the `\<newline>` continuation. */
const ESCAPE = '\\\\(?:u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]{2}|[0-9]{3}|\\r?\\n|[\\\\"\'ntbrafv0])'

/** `%d`, `%.2f`, `%+A`, `%*i` — typed printf specifiers, checked by the compiler. */
const FORMAT = '%[-+ 0]*(?:\\d+|\\*)?(?:\\.\\d+)?[bscdiuxXoeEfFgGMOAat%]'

/** `42y`, `42uy`, `1UL`, `3I`, `1.0m` — the integer and numeric suffixes. */
const SUFFIX = '(?:[uU][yslLnN]?|[yslLnNIfFmM])?'

const fsharp: Grammar = {
  name: 'fsharp',
  aliases: ['fs', 'fsx', 'fsi', 'f#'],
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        // `(*)` is multiplication used as a function — `List.reduce (*)` — and
        // has to win over the comment opener sitting inside it.
        { match: '\\(\\*\\)', scope: 'operator' },
        { match: '///[^\\n]*', scope: 'comment.doc' },
        { match: '//[^\\n]*', scope: 'comment' },
        { match: '\\(\\*', scope: 'comment', push: 'block-comment' },

        // Compiler directives: `#if`, `#nowarn`, `#r "nuget: …"`. Anchored to
        // the start of a line, which is the only place they are legal — a `#`
        // anywhere else is a flexible type (`#seq<int>`) and stays unscoped.
        { match: '^([ \\t]*)(#[a-zA-Z]+)', scope: [null, 'keyword'] },

        // `[<Obsolete("…")>]`. The scan excludes `[` so a run of openers cannot
        // cost a line rescan each; an attribute holding a nested `[` or a line
        // break renders unscoped instead.
        { match: '\\[<[^[\\]\\n]*>\\]', scope: 'decorator' },

        { include: 'strings' },

        // The apostrophe rules. A char literal always closes on the same line;
        // a generic parameter never closes at all. Both are blocked from firing
        // mid-name by the lookbehind, so the `'` in `sum'` stays inert.
        {
          match: `(?<![\\w'])'(?:[^'\\\\\\n]|${ESCAPE})'B?`,
          scope: 'string',
        },
        { match: `(?<![\\w'])'${ID}`, scope: 'type' },
        // `^T` in an inline function's statically resolved constraints. The
        // lookbehind keeps `a^b` — string concatenation — out of it.
        { match: `(?<![\\w')\\]])\\^${ID}`, scope: 'type' },

        { match: '``[^`\\n]*``', scope: 'variable' },

        // An active pattern definition: `let (|Even|Odd|)`, `let (|Parsed|_|)`.
        { match: "\\(\\|[A-Za-z_][\\w'|]*\\|_?\\)", scope: 'function' },

        // An operator used as a value: `let (+.) a b = …`, `List.reduce (|>)`.
        // Anything starting `(*` is a comment and was matched above, which is
        // exactly why F# makes you write `( *. )` with spaces.
        { match: '\\([!%&*+\\-./<=>@^|~?]+\\)', scope: 'operator' },

        {
          match: "\\b(open)([ \\t]+)([A-Za-z_][\\w'.]*)",
          scope: ['keyword.import', null, 'namespace'],
        },
        {
          match: "\\b(namespace|module)([ \\t]+)((?:rec|global)[ \\t]+)?([A-Za-z_][\\w'.]*)",
          scope: ['keyword.declaration', null, 'keyword.declaration', 'namespace'],
        },
        {
          match: `\\b(type)([ \\t]+)${MODS}(${NAME})`,
          scope: ['keyword.declaration', null, 'keyword.declaration', 'class'],
        },

        // A binding whose name is followed by `=`, `:` or `,` binds a value;
        // anything else means parameters follow, so it binds a function. That is
        // the distinction F# itself does not make, and it is right on ordinary
        // code — a curried `let add = fun a b -> …` still reads as a value.
        {
          match: `\\b(let|use|and)([ \\t]+)${MODS}(${NAME})(?=[ \\t]*[:=,](?!=))`,
          scope: ['keyword.declaration', null, 'keyword.declaration', 'variable'],
        },
        {
          match: `\\b(let|use|and)([ \\t]+)${MODS}${NOT_MOD}(${NAME})`,
          scope: ['keyword.declaration', null, 'keyword.declaration', 'function'],
        },
        // `member this.Add`, `member _.Count`, `override x.ToString`. The
        // self-identifier is a name the author picked, not a keyword, but in
        // this position it is always the instance.
        {
          match: `\\b(member|override|abstract|default|val)([ \\t]+)${MODS}(?:(${ID})(\\.))?(${NAME})`,
          scope: ['keyword.declaration', null, 'keyword.declaration', 'variable.builtin', 'punctuation', 'function'],
        },

        // Computation expressions. These have to beat the plain keyword rules,
        // which would otherwise take `let` and leave the `!` behind.
        { match: '\\b(?:return|yield|match|do)!', scope: 'keyword.control' },
        { match: '\\b(?:let|use|and)!', scope: 'keyword.declaration' },

        {
          match:
            '\\b(?:if|then|elif|else|match|when|with|try|finally|for|to|downto|while|do|done|return|yield|assert)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:let|rec|and|use|fun|function|type|member|override|abstract|default|static|val|mutable|new|inherit|interface|class|struct|begin|end|module|exception|delegate|inline|private|public|internal|extern|lazy|global|fixed)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:open|namespace)\\b', scope: 'keyword.import' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        {
          match: '\\b(?:null|None|Some|Ok|Error|ValueNone|ValueSome|nan|infinity)\\b',
          scope: 'constant.builtin',
        },
        {
          match: '\\b(?:not|in|as|of|mod|land|lor|lxor|lsl|lsr|asr|upcast|downcast|box|unbox|typeof|nameof|sizeof)\\b',
          scope: 'keyword.operator',
        },
        // `this` is a convention rather than a keyword, but no F# reader takes
        // it for anything else; `base` really is one.
        { match: '\\b(?:this|base)\\b', scope: 'variable.builtin' },

        // `u?int(?:8|16|32|64)?` is the whole integer family in one branch —
        // spelling all ten out costs bytes a shared prefix already covers.
        {
          match:
            '\\b(?:u?int(?:8|16|32|64)?|u?nativeint|s?byte|float(?:32)?|double|single|decimal|bigint|char|string|bool|unit|obj|exn|list|array|seq|v?option|Result|Option|Map|Set|Async|Task)\\b',
          scope: 'type.builtin',
        },
        {
          match: '\\b(?:e?printfn?|sprintf|failwithf?|raise|ignore|id|fst|snd)\\b',
          scope: 'function.builtin',
        },

        // Matched from the dot, so a member never picks up the builtin colours.
        {
          match: `(\\.)(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },

        // Record fields. A field is a capitalised name followed by `:` in a
        // declaration or `=` in a construction, and it is either the first
        // thing on its line or the first thing after the brace. A record
        // written `{ A: int; B: int }` on one line loses everything after the
        // `;` to the type rule below, which is the price of not needing a
        // parser to tell a field from a comparison.
        {
          match: "^([ \\t]*)([A-Z][\\w']*)(?=[ \\t]*[:=](?!=))",
          scope: [null, 'property'],
        },
        {
          match: "(\\{)([ \\t]*)([A-Z][\\w']*)(?=[ \\t]*[:=](?!=))",
          scope: ['punctuation.bracket', null, 'property'],
        },

        // Modules, types, DU cases and .NET classes all look the same here, and
        // all of them read fine as a type.
        { match: "\\b[A-Z][\\w']*", scope: 'type' },

        // An annotated parameter: `(name: string)`. Constructors and members
        // annotate almost everything, which is where this pays off.
        {
          match: "(\\()([ \\t]*)([a-z_][\\w']*)(?=[ \\t]*:)",
          scope: ['punctuation.bracket', null, 'variable.parameter'],
        },

        { match: `\\b0[xX][0-9a-fA-F_]+${SUFFIX}\\b`, scope: 'number' },
        { match: `\\b0[bBoO][0-9_]+${SUFFIX}\\b`, scope: 'number' },
        {
          // `(?!\.)` on the fraction keeps the range `1..10` from starting as
          // the float `1.` and leaving a stray dot behind.
          match: `\\b\\d[\\d_]*\\.(?!\\.)(?:\\d[\\d_]*)?(?:[eE][-+]?\\d+)?[fFmM]?|\\b\\d[\\d_]*(?:[eE][-+]?\\d+)[fFmM]?|\\b\\d[\\d_]*${SUFFIX}\\b`,
          scope: 'number',
        },

        // Array and anonymous-record delimiters, before the single brackets get
        // a chance to split them.
        { match: '\\[\\||\\|\\]|\\{\\||\\|\\}', scope: 'punctuation.bracket' },
        // `->`, `||>` and friends need no branch of their own: they are made of
        // operator characters, and adjacent ranges sharing a scope merge into
        // one span downstream. Only the operators starting with `:` — a
        // delimiter on its own — and `..` have to be spelled out.
        {
          match: '::|:\\?>|:>|:\\?|:=|\\.\\.|[-+*/%@^&|!~<>=?]=?',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[;,:]', scope: 'punctuation.delimiter' },
      ],
    },

    /** F# block comments nest, so this counts depth instead of scanning to the first `*)`. */
    'block-comment': {
      default: 'comment',
      rules: [
        { match: '\\(\\*', push: 'block-comment' },
        { match: '\\*\\)', pop: true },
      ],
    },

    strings: {
      rules: [
        {
          match: '(\\$)(""")',
          scope: ['string.special', 'string'],
          push: 'interp-triple',
        },
        { match: '"""', scope: 'string', push: 'triple' },
        {
          match: '(\\$@|@\\$)(")',
          scope: ['string.special', 'string'],
          push: 'interp-verbatim',
        },
        {
          match: '(@)(")',
          scope: ['string.special', 'string'],
          push: 'verbatim',
        },
        {
          match: '(\\$)(")',
          scope: ['string.special', 'string'],
          push: 'interp',
        },
        { match: '"', scope: 'string', push: 'string' },
      ],
    },

    /** `{{`/`}}` are literal braces; a single `{` opens an expression. */
    'interp-body': {
      rules: [
        { match: '\\{\\{|\\}\\}', scope: 'string.escape' },
        { match: '\\{', scope: 'interpolation', push: 'interp-expr' },
      ],
    },

    /** Backslash escapes, plus the printf specifiers every flavour understands. */
    'string-body': {
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: FORMAT, scope: 'string.special' },
      ],
    },
    /** A verbatim string has no backslash escapes; `""` is its only one. */
    'verbatim-body': {
      rules: [
        { match: '""', scope: 'string.escape' },
        { match: FORMAT, scope: 'string.special' },
      ],
    },

    string: {
      default: 'string',
      rules: [
        { include: 'string-body' },
        // `"…"B` is a byte string; the suffix belongs to the literal.
        { match: '"B?', scope: 'string', pop: true },
        // A plain string may legally hold a newline, but an unterminated one is
        // the far more common reading — and popping keeps a stray quote from
        // swallowing the rest of the file. The `\<newline>` continuation is an
        // escape, so it is matched above and survives.
        { match: '$', pop: true },
      ],
    },
    interp: {
      default: 'string',
      rules: [
        { include: 'string-body' },
        { include: 'interp-body' },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },

    // Verbatim and triple-quoted strings span lines on purpose, so neither pops
    // at a line break.
    verbatim: {
      default: 'string',
      rules: [{ include: 'verbatim-body' }, { match: '"', scope: 'string', pop: true }],
    },
    'interp-verbatim': {
      default: 'string',
      rules: [{ include: 'verbatim-body' }, { include: 'interp-body' }, { match: '"', scope: 'string', pop: true }],
    },
    triple: {
      default: 'string',
      rules: [
        { match: FORMAT, scope: 'string.special' },
        { match: '"""', scope: 'string', pop: true },
      ],
    },
    'interp-triple': {
      default: 'string',
      rules: [
        { match: FORMAT, scope: 'string.special' },
        { include: 'interp-body' },
        { match: '"""', scope: 'string', pop: true },
      ],
    },

    'interp-expr': {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        // `{value,10:N2}` — an alignment and a .NET format string. `(?![:=])`
        // leaves the cons operator in `{a :: b}` alone, which is the one
        // expression that otherwise looks exactly like a format spec. The length
        // cap keeps an unclosed `{` cheap: the scan runs to the end of the line
        // and then fails the lookahead, once per `:`, so an uncapped one is
        // quadratic on a run of colons. `(?![:=])` alone does not bound it — it
        // rejects `::` early, but `: ` clears the guard and starts the scan.
        { match: ':(?![:=])[^{}"\\n]{0,120}(?=\\})', scope: 'string.special' },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },
    /** Tracks brace depth so a record inside an interpolation cannot end it. */
    brace: {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },
  },
}

export default fsharp
