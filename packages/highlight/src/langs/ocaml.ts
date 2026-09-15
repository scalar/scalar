import type { Grammar } from '../core/types'

/**
 * OCaml.
 *
 * The apostrophe is the whole story in this language: it opens a char literal
 * (`'a'`), it opens a type variable (`'a`), and it is a perfectly ordinary
 * letter at the end of an identifier (`acc'`). The three are told apart by
 * shape and by what precedes them:
 *
 * - a char literal always closes, a type variable never does — the same trick
 *   Rust needs for lifetimes
 * - both are rejected when the character before is an identifier character, so
 *   the quote in `acc' 'x'` cannot pair with the one after it
 *
 * The other corners worth knowing about:
 *
 * - comments nest, so `(*` and `*)` run a state rather than a lazy `[\s\S]*?`
 * - quoted string literals (`{|raw|}`) process no escapes at all
 * - `let f x = …` defines a function and `let x = …` binds a value; the
 *   parameters between the two are scoped through a small state machine
 *
 * Ordinary identifiers deliberately match no rule and inherit the block's
 * foreground, which keeps both the markup and the visual noise down.
 */

/**
 * A value identifier — and the tail is length-capped on purpose.
 *
 * `'` is legal inside an identifier but is not a `\w` character, so `\b` sits
 * between every `'` and the letter after it. In `a'a'a'…` — one valid
 * identifier — that is a word boundary every two characters, and the rules that
 * match an identifier and then test a lookahead (`name(`) would restart at each
 * one and rescan to the end of the line. The cap bounds that scan; names this
 * long do not occur in real code, and one that did would render unscoped.
 */
const LID = "[a-z_][A-Za-z0-9_']{0,128}"

/** A module, constructor or exception name. Capitalised, same cap as `LID`. */
const UID = "[A-Z][A-Za-z0-9_']{0,128}"

/**
 * Guards the end of a keyword. `\b` is not enough on its own: `'` is not a word
 * character, so `\blet\b` happily fires inside the identifier `let'`.
 */
const END = "(?![\\w'])"

/**
 * `\255`, `\xFF`, `\o377`, `\u{1F600}`, a `\` line continuation, and — last —
 * any other escaped character.
 *
 * The catch-all matters more than the precise forms: it guarantees that `\\`
 * and `\"` are consumed as a unit, so a closing quote can never be misread.
 */
const ESCAPE = '\\\\(?:[0-9]{3}|x[0-9a-fA-F]{2}|o[0-3][0-7]{2}|u\\{[0-9a-fA-F]{1,6}\\}|\\r?\\n[ \\t]*|[\\s\\S])'

/** `Printf` conversions — `%s`, `%-10s`, `%04d`, `%.2f`, `%a`, `%!`. */
const FORMAT = '%[-0+ #]*(?:\\d+|\\*)?(?:\\.(?:\\d+|\\*))?[hlLn]?[diuxXosScCfFeEgGbBaltT%!,]'

const ocaml: Grammar = {
  name: 'ocaml',
  aliases: ['ml', 'mli'],
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        { include: 'atoms' },

        // Attributes (`[@inline]`, `[@@deriving show]`) and extension nodes
        // (`[%sexp_of: t]`). Only the marker and its name are claimed — the
        // payload is ordinary syntax, and scanning ahead for the `]` would cost
        // a line rescan per `[`.
        {
          match: "\\[(?:@{1,3}|%{1,2})[A-Za-z_][\\w.']{0,64}",
          scope: 'decorator',
        },

        { include: 'definitions' },

        // A dotted path: `Buffer.add_string`, `Map.Make`. Claiming the dot here
        // keeps the name after it available to the builtin and call rules, so
        // `Printf.printf` still reads as a builtin.
        { match: `(${UID})(\\.)`, scope: ['namespace', 'punctuation'] },
        { match: `(\\.)(${LID})`, scope: ['punctuation', 'variable.member'] },

        // Labelled and optional arguments: `~sku:`, `?verbose`. The letter is
        // required, so the `~-` and `?` operators fall through.
        { match: `[~?]${LID}`, scope: 'variable.parameter' },
        // Polymorphic variant tags. The backtick has no other use in OCaml.
        { match: "`[A-Za-z_][\\w']{0,128}", scope: 'constant' },

        {
          match: `\\b(?:if|then|else|match|when|with|for|to|downto|while|do|done|begin|end|try|assert)${END}`,
          scope: 'keyword.control',
        },
        // `in` closes the `let` it belongs to, so it reads as part of the
        // binding rather than as control flow.
        {
          match: `\\b(?:let|rec|and|in|fun|function|type|val|external|module|struct|sig|object|class|method|inherit|initializer|constraint|mutable|private|virtual|nonrec|exception|new|lazy)${END}`,
          scope: 'keyword.declaration',
        },
        { match: `\\b(?:open|include)${END}`, scope: 'keyword.import' },
        {
          match: `\\b(?:mod|land|lor|lxor|lsl|lsr|asr|or)${END}`,
          scope: 'keyword.operator',
        },
        { match: `\\b(?:as|of)${END}`, scope: 'keyword' },

        { include: 'types' },

        // `ref` is a builtin rather than a builtin type, because `ref 0` turns
        // up far more often in code than `int ref` does.
        {
          match: `\\b(?:printf|sprintf|eprintf|fprintf|print_endline|print_string|print_newline|prerr_endline|failwith|invalid_arg|raise|ignore|ref|incr|decr|not|fst|snd|compare|min|max|exit)${END}`,
          scope: 'function.builtin',
        },
        // OCaml has no overloading, so every primitive conversion is spelled
        // `<to>_of_<from>`. One pattern is smaller than the sixteen names.
        {
          match: `\\b(?:int|float|string|char|bool|bytes)_of_(?:int|float|string|char|bool|bytes)${END}`,
          scope: 'function.builtin',
        },

        // Everything capitalised that is not a module path is a constructor —
        // variants, exceptions, `Node`, `Leaf`. They are values, so they read as
        // constants rather than as types.
        { match: `\\b${UID}`, scope: 'constant' },
        // OCaml applies functions without parentheses, so only a parenthesised
        // call site is recognisable at all — and even then the name has to be
        // the head of the application: the lookbehind is what keeps the `sku`
        // in `Map.add sku (v + 1) m` from reading as a call. `f x y` stays
        // unscoped, which is the honest answer, because nothing in the syntax
        // separates it from `a b c`.
        {
          match: `(?<![\\w'\\)\\]] )\\b${LID}(?=[ \\t]*\\()`,
          scope: 'function.call',
        },

        { match: '[,;]', scope: 'punctuation.delimiter' },
        // A lone `:` annotates; `::`, `:=` and `:>` are operators.
        { match: ':(?![:=>])', scope: 'punctuation.delimiter' },
        // One rule for every operator, because OCaml lets users define their
        // own out of these characters — `>>=`, `|>`, `+.`, `@@` and friends are
        // not a fixed list.
        { match: '[!$%&*+\\-./:<>=?@^|~]+', scope: 'operator' },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
      ],
    },

    // ---- literals and other self-contained tokens ----------------------------
    // Shared with the parameter states, which have to see a literal before they
    // see a name: without this, the `false` in `?(verbose = false)` would read
    // as another parameter.
    atoms: {
      rules: [
        { include: 'comments' },
        { include: 'strings' },
        { include: 'numbers' },
        { match: `\\b(?:true|false)${END}`, scope: 'boolean' },
        { match: `\\b(?:None|Some|Ok|Error)${END}`, scope: 'constant.builtin' },
      ],
    },

    // ---- comments ------------------------------------------------------------
    comments: {
      rules: [
        // `(**)` is an empty comment, not the start of a doc comment.
        {
          match: '\\(\\*\\*(?!\\))',
          scope: 'comment.doc',
          push: 'comment-doc',
        },
        { match: '\\(\\*', scope: 'comment', push: 'comment' },
      ],
    },

    // Comments nest, so the opener pushes another copy of this state and only
    // the matching `*)` pops. A `"*)"` inside a string inside a comment ends the
    // comment early — OCaml lexes strings in comments, we do not.
    comment: {
      default: 'comment',
      rules: [
        { match: '\\(\\*', push: 'comment' },
        { match: '\\*\\)', pop: true },
      ],
    },
    'comment-doc': {
      default: 'comment.doc',
      rules: [
        { match: '\\(\\*', push: 'comment-doc' },
        { match: '\\*\\)', pop: true },
      ],
    },

    // ---- strings, chars and numbers ------------------------------------------
    strings: {
      rules: [
        // `{id|raw|id}`. Matching the identifier on both ends needs a
        // backreference, so any closing delimiter is accepted: a body
        // containing `|other}` ends the literal early.
        { match: '\\{[a-z_]*\\|', scope: 'string', push: 'quoted-string' },
        { match: '"', scope: 'string', push: 'string' },
        // A char literal closes; a type variable does not. The lookbehind is
        // what keeps the trailing quote of `acc'` from opening one.
        { match: `(?<![\\w'])'(?:[^'\\\\\\n]|${ESCAPE})'`, scope: 'string' },
      ],
    },

    string: {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: FORMAT, scope: 'string.special' },
        { match: '"', scope: 'string', pop: true },
      ],
    },

    // Deliberately no escape rule: a quoted string literal is raw.
    'quoted-string': {
      default: 'string',
      rules: [{ match: '\\|[a-z_]*\\}', scope: 'string', pop: true }],
    },

    numbers: {
      rules: [
        // Hex covers hex floats too (`0x1.8p3`). `l`/`L`/`n` are the Int32,
        // Int64 and nativeint suffixes.
        {
          match: '\\b0[xX][0-9a-fA-F_]+(?:\\.[0-9a-fA-F_]*)?(?:[pP][-+]?\\d+)?[lLn]?',
          scope: 'number',
        },
        { match: '\\b0[oO][0-7_]+[lLn]?', scope: 'number' },
        { match: '\\b0[bB][01_]+[lLn]?', scope: 'number' },
        // No closing boundary, so the trailing dot of a float like `1.` stays
        // part of the literal instead of being backtracked away.
        {
          match: '\\b\\d[\\d_]*(?:\\.[\\d_]*)?(?:[eE][-+]?\\d[\\d_]*)?[lLn]?',
          scope: 'number',
        },
      ],
    },

    types: {
      rules: [
        // A type variable: `'a`, `'_weak1`. The char rule ran first, so
        // anything that closes has already been claimed.
        { match: `(?<![\\w'])'${LID}`, scope: 'type' },
        {
          match: `\\b(?:int|float|string|char|bool|unit|list|array|option|result|bytes|exn|int32|int64|nativeint)${END}`,
          scope: 'type.builtin',
        },
        // A lowercase name straight after an annotation colon is a user type —
        // `(it : item)`, `sku : sku_id`. The space is required, which is what
        // keeps a labelled argument (`~key:value`) out of it.
        { match: `(?<=: )${LID}`, scope: 'type' },
      ],
    },

    // ---- definitions ---------------------------------------------------------
    definitions: {
      rules: [
        // `let open M in`, `let module M = …` and `let exception E in` are
        // keyword pairs, not a name being bound.
        {
          match: `\\b(let|and)([ \\t]+)(?:(rec)([ \\t]+))?(?!(?:open|module|exception)${END})(${LID})(?=[ \\t]*[=:])`,
          scope: ['keyword.declaration', null, 'keyword.declaration', null, 'variable'],
        },
        // Anything else after the name is a parameter list, which is what makes
        // this a function definition rather than a value binding.
        {
          match: `\\b(let|and)([ \\t]+)(?:(rec)([ \\t]+))?(?!(?:open|module|exception)${END})(${LID})`,
          scope: ['keyword.declaration', null, 'keyword.declaration', null, 'function'],
          push: 'params',
        },
        { match: `\\bfun${END}`, scope: 'keyword.declaration', push: 'params' },

        // In a signature, an arrow in the type makes the entry a function.
        //
        // The lookahead's scan is capped. Uncapped, `[^\n]*->` rescans to end
        // of line whenever there is no arrow, and it is retried at every `val`
        // on the line: one 64 KB line of `val a:` cost 3.8 s. The cap makes it
        // linear per line at the price of missing the arrow in a signature
        // whose type is longer than the cap. It also gets
        // `val apply : (int -> int) t` wrong, reading a nested arrow as the
        // entry's own.
        {
          match: `\\b(val|external)([ \\t]+)(${LID})(?=[ \\t]*:[^\\n]{0,200}->)`,
          scope: ['keyword.declaration', null, 'function'],
        },
        {
          match: `\\b(val|external)([ \\t]+)(${LID})`,
          scope: ['keyword.declaration', null, 'variable'],
        },

        // `type t`, `type 'a tree`. A multi-parameter head (`type ('a, 'b) t`)
        // falls through to the plain keyword rule and leaves the name unscoped.
        {
          match: `\\b(type)([ \\t]+)('${LID})?([ \\t]*)(${LID})`,
          scope: ['keyword.declaration', null, 'type', null, 'type'],
        },
        {
          match: `\\b(module)([ \\t]+)(?:(type)([ \\t]+))?(${UID})`,
          scope: ['keyword.declaration', null, 'keyword.declaration', null, 'namespace'],
        },
        {
          match: `\\b(open!?|include)([ \\t]+)(${UID}(?:\\.${UID})*)`,
          scope: ['keyword.import', null, 'namespace'],
        },
      ],
    },

    // ---- parameters ----------------------------------------------------------
    // Entered after `let name` and after `fun`, left at the `=` or `->` that
    // starts the body. Parentheses get their own state so that the arrow in
    // `(g : int -> int)` and the `=` in `?(n = 10)` do not end the list early.
    params: {
      rules: [
        { match: '=(?![=<>|&])', scope: 'operator', pop: true },
        { match: '->', scope: 'operator', pop: true },
        { include: 'param-atoms' },
      ],
    },
    'params-paren': {
      rules: [{ match: '\\)', scope: 'punctuation.bracket', pop: true }, { include: 'param-atoms' }],
    },
    'param-atoms': {
      rules: [
        { match: '\\(', scope: 'punctuation.bracket', push: 'params-paren' },
        { include: 'atoms' },
        // Types first: an annotation's `int` is a type, not another parameter.
        { include: 'types' },
        { match: `[~?]?${LID}`, scope: 'variable.parameter' },
        { include: 'expression' },
      ],
    },
  },
}

export default ocaml
