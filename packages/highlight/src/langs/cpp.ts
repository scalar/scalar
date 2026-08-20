import type { Grammar } from '../core/types'

/**
 * C++.
 *
 * What this grammar spends its bytes on, and why:
 *
 * - Raw string literals get a state. `R"tag(...)tag"` can only be matched
 *   exactly with a backreference and the compiler rejects those, so the state
 *   closes on any `)tag"` — see `raw-string` for what that gets wrong.
 * - `'` is both a character literal and a digit separator. The number rules
 *   accept `1'048'576` and win because they start at the digit, which is to the
 *   left of the quote the character rule would have opened on.
 * - A definition is told from a call by the `{` that follows the parameter
 *   list, with room in between for `const noexcept`, a trailing return type and
 *   a constructor's member-initialiser list.
 * - The preprocessor is a second language living at the start of a line, so its
 *   directives are anchored to `^`, exactly as in the C grammar.
 *
 * Angle brackets stay operators. Nothing local to a `<` says whether `a < b` is
 * a comparison or `Ring<T>` a template argument list, and the guesses that get
 * it right cost more than the colour is worth.
 *
 * Ordinary identifiers deliberately match no rule and inherit the block's
 * foreground, which keeps both the markup and the grammar small.
 */

const ID = '[A-Za-z_]\\w*'

/** `\n`, `\0`, `\x41`, `\u00e9`, `\U0001F600`, `\033`, and a line continuation. */
const ESCAPE = '\\\\(?:x[0-9a-fA-F]+|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[0-7]{1,3}|\\r?\\n|.)'

/**
 * printf conversions, length modifiers included (`%zu`, `%#06x`, `%.2f`).
 *
 * Every run is capped. An open-ended `[-+ #0']*` before a required conversion
 * character means one `%` followed by a long flag run is rescanned from every
 * column, which is quadratic on input nobody wrote by hand.
 */
const FORMAT = "%[-+ #0']{0,8}(?:\\d{1,10}|\\*)?(?:\\.(?:\\d{1,10}|\\*)?)?(?:hh|ll|[hljztL])?[diouxXeEfFgGaAcspn%]"

/**
 * Any literal suffix. `u`, `ull`, `f` and `z` are the standard ones; `_km`,
 * `ms` and `sv` are user-defined literals, which may be spelled as any
 * identifier — so one open rule covers both, at the price of reading the `abc`
 * in the ill-formed `123abc` as part of the number.
 */
const SUFFIX = '(?:[A-Za-z_]\\w*)?'

/** The `u8`/`u`/`U`/`L` prefix on a string, character or raw literal. */
const ENCODING = '(?:u8|[uUL])?'

/**
 * What C++ lets a parameter list be followed by before the rest of the
 * declaration: the cv- and ref-qualifiers, `noexcept`, and the `try` that opens
 * a function-try-block.
 */
const QUALIFIER = '(?:const|noexcept|override|final|try|&&?)'

/**
 * The widest run of whitespace the declaration rules step over.
 *
 * Twelve was not enough for ordinary code: three levels of four-space indent
 * put thirteen characters between a `)` and the `:` on the next line, and the
 * colouring changed with the indentation. Every run is still capped, because an
 * open-ended one would be replayed from each position of a line of blanks.
 */
const GAP = '[ \\t\\r\\n]{0,32}'

/**
 * Everything C++ allows between a parameter list and the `{` of a body:
 * qualifiers, a trailing return type, then a constructor's member-initialiser
 * list. Every scan excludes `{`, so each has exactly one place it can stop and
 * the lookahead cannot backtrack its way into a quadratic rescan of the line.
 *
 * The member-initialiser scan has to end on the `)` of the last initialiser.
 * Without that, a ternary whose false branch is brace-initialised — `ok ?
 * parse(s) : Result{}` — satisfies the branch and turns the call into a
 * definition. The price is that `: n_{0} {}` is not recognised, which the
 * `{`-free scan already gave up on.
 */
const AFTER_PARAMS =
  `(?:[ \\t]*${QUALIFIER}){0,4}[ \\t]*` +
  `(?:->[^;{}\\n]{0,60})?(?:${GAP}:[^;{}]{0,158}\\)[ \\t\\r\\n]{0,4})?(?:\\r?\\n[ \\t]*)?\\{`

/**
 * Qualifiers and whitespace, as they sit between the `)` of a constructor's
 * parameter list and the `:` that opens its member-initialiser list — including
 * the `try` of `Foo::Foo() try : n_(0) {}`.
 *
 * Each repetition has to consume a qualifier word, so the whitespace runs never
 * compete for the same characters and a `)` followed by blanks costs one pass
 * over them rather than one per split.
 */
const BEFORE_INIT = `(?:${GAP}${QUALIFIER}){0,4}${GAP}`

const cpp: Grammar = {
  name: 'cpp',
  aliases: ['c++', 'cc', 'cxx', 'hpp', 'hxx', 'h++', 'cppm'],
  states: {
    root: {
      rules: [
        // ---- comments --------------------------------------------------------
        // Doxygen opens with `/**` or `/*!`; the lookahead keeps `/**/` and a
        // `/***` banner out of the doc scope.
        // States, not a lazy `[\\s\\S]*?` scan: that form runs to EOF and fails
        // once per opener, which is O(n2) on an unterminated `/*`.
        {
          match: '/\\*[*!](?![/*])',
          scope: 'comment.doc',
          push: 'doc-comment',
        },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },
        { match: '//[/!][^\\n]*', scope: 'comment.doc' },
        { match: '//[^\\n]*', scope: 'comment' },

        // ---- preprocessor ----------------------------------------------------
        // Indentation is captured rather than scoped, so `#  if` inside a nest
        // of conditionals keeps its leading whitespace unstyled.
        {
          match: '^([ \\t]*)(#[ \\t]*include(?:_next)?)([ \\t]*)(<[^>\\n]*>|"[^"\\n]*")',
          scope: [null, 'keyword.import', null, 'string'],
        },
        // A macro is function-like exactly when `(` touches its name.
        {
          match: `^([ \\t]*)(#[ \\t]*define)([ \\t]+)(${ID})(?=\\()`,
          scope: [null, 'keyword.declaration', null, 'function'],
        },
        {
          match: `^([ \\t]*)(#[ \\t]*(?:define|undef))([ \\t]+)(${ID})`,
          scope: [null, 'keyword.declaration', null, 'constant'],
        },
        {
          // `elifdef`/`elifndef` are C++23, and they have to precede `elif` in
          // the alternation or `\b` would never let the longer spelling match.
          match: '^([ \\t]*)(#[ \\t]*(?:ifdef|ifndef|elifdef|elifndef|if|elif|else|endif))\\b',
          scope: [null, 'keyword.control'],
        },
        // Everything else the preprocessor understands: pragma, error, line…
        { match: '^([ \\t]*)(#[ \\t]*[a-z_]+)', scope: [null, 'keyword'] },
        // The backslash that splices a macro onto the next line.
        { match: '\\\\(?=\\r?\\n)', scope: 'operator' },

        // ---- attributes ------------------------------------------------------
        // `[[nodiscard]]`, `[[deprecated("use push")]]`. The scan excludes both
        // brackets, so a run of `[[` costs O(1) each rather than O(line); an
        // attribute holding a nested `[` renders unscoped.
        { match: '\\[\\[[^\\[\\]\\n]{0,120}\\]\\]', scope: 'decorator' },

        // ---- literals --------------------------------------------------------
        // Raw strings first: the opener is `R"`, and the plain-string rule would
        // otherwise take the quote and read the body as ordinary escapes.
        {
          match: `(${ENCODING}R)("[^()\\\\\\s]{0,16}\\()`,
          scope: ['string.special', 'string'],
          push: 'raw-string',
        },
        {
          match: `${ENCODING}(")`,
          scope: ['string'],
          rest: 'string.special',
          push: 'string',
        },
        // Bounded repetition: a stray apostrophe must not scan to end of line,
        // and multi-character constants (`'ab'`) are still legal C++.
        {
          match: `${ENCODING}('(?:[^'\\\\\\n]|\\\\[^\\n]){1,8}')`,
          scope: ['string'],
          rest: 'string.special',
        },
        // ---- keywords --------------------------------------------------------
        // The tag rule sits above the plain `class` keyword so the two are one
        // match and the name introduced reads as a class.
        {
          match: `\\b(class|struct|union|enum(?:[ \\t]+(?:class|struct))?)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        {
          match: `\\b(namespace)([ \\t]+)(${ID}(?:::${ID})*)`,
          scope: ['keyword.declaration', null, 'namespace'],
        },
        // `using namespace` pulls names in; a bare `using` declares an alias.
        // The path is claimed here so it reads the same way `namespace a::b`
        // does — the `(?=::)` rule further down only reaches the segments that
        // have a `::` after them, which leaves the last one unscoped.
        {
          match: `\\b(using)([ \\t]+)(namespace)([ \\t]+)(${ID}(?:::${ID})*)`,
          scope: ['keyword.import', null, 'keyword.import', null, 'namespace'],
        },
        {
          match: '\\b(using)([ \\t]+)(namespace)\\b',
          scope: ['keyword.import', null, 'keyword.import'],
        },

        {
          match:
            '\\b(?:if|else|for|while|do|switch|case|default|break|continue|return|goto|try|catch|throw|co_await|co_return|co_yield)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:class|struct|union|enum|typedef|using|template|typename|namespace|auto|const|constexpr|consteval|constinit|static|static_assert|extern|inline|virtual|override|final|explicit|friend|mutable|volatile|thread_local|public|private|protected|operator|concept)\\b',
          scope: 'keyword.declaration',
        },
        // The cast operators end in `_cast`, and `_` is a word character, so
        // `\b static \b` cannot reach inside `static_cast` — the two stay apart
        // without any ordering trick.
        {
          match:
            '\\b(?:sizeof|alignof|alignas|typeid|decltype|noexcept|requires|new|delete|static_cast|dynamic_cast|const_cast|reinterpret_cast|and|or|not|xor|defined)\\b',
          scope: 'keyword.operator',
        },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\b(?:nullptr|NULL|EOF)\\b', scope: 'constant.builtin' },
        // The iostream globals, plus the `endl` every program uses beside them.
        {
          match: '\\b(?:this|cout|cerr|clog|cin|endl|stdin|stdout|stderr|errno)\\b',
          scope: 'variable.builtin',
        },
        // `map`, `set`, `array`, `pair`, `list` and `function` are missing on
        // purpose: they are as often a variable's name as a type's.
        {
          match:
            '\\b(?:void|bool|char|char(?:8|16|32)_t|wchar_t|short|int|long|float|double|signed|unsigned|size_t|ssize_t|ptrdiff_t|nullptr_t|u?int(?:8|16|32|64|ptr|max)_t|string|string_view|vector|unordered_map|unordered_set|shared_ptr|unique_ptr|weak_ptr|optional|variant|tuple|ostream)\\b',
          scope: 'type.builtin',
        },

        // ---- names -----------------------------------------------------------
        // A leading underscore pair is reserved for the implementation, so
        // `__FILE__`, `__VA_ARGS__` and `__attribute__` are all compiler magic.
        { match: '\\b__\\w+', scope: 'variable.special' },

        // Matched at the accessor, so `obj.size` never reads as the free
        // function and `ptr->count` never as a call.
        {
          match: `(->)(${ID})(?=[ \\t]*\\()`,
          scope: ['operator', 'function.method'],
        },
        { match: `(->)(${ID})`, scope: ['operator', 'variable.member'] },
        {
          match: `(\\.)(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },

        // An entry in a constructor's member-initialiser list is spelled like a
        // definition — `size_(0) {}` is an identifier, a parameter list and a
        // brace — so the last one would otherwise read as one. What tells them
        // apart is the `,` or the `:` that introduces the entry, and keying on
        // that punctuation keeps the guard off the hot path: it is tried only
        // where one of those appears, not at every position.
        //
        // The `:` half has to see the `)` of the parameter list too. A bare `:`
        // is far more often a label, an access specifier or a ternary, and
        // guarding on one of those demotes what follows: `public:` turned the
        // constructor right under it into a call, and `case 1: printf(` and
        // `a ? b : free(p)` lost their builtin colour. It is a state rather
        // than one long rule because `noexcept` and `try` may sit between the
        // two, and swallowing them here would cost them their keyword colour.
        //
        // The comma rule swallows its delimiter, so a builtin called straight
        // after one — `f(a, move(b))` — reads as an ordinary call rather than
        // as a builtin.
        {
          match: `(,)(${GAP})(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation.delimiter', null, 'function.call'],
        },
        {
          match: `\\)(?=${BEFORE_INIT}:${GAP}${ID}[ \\t]*\\()`,
          scope: 'punctuation.bracket',
          push: 'member-init',
        },

        // A definition is a parameter list followed by a body. The parameter
        // scan excludes parens, so `if (ok(x)) {` and `while (next(it)) {` stay
        // calls — and the keyword rules above have already claimed `if` and
        // `while` anyway. A definition taking a function pointer, or one with
        // more than 120 characters of parameters, falls back to `function.call`,
        // and so does a prototype, which ends in `;` rather than a body.
        {
          match: `\\b${ID}(?=[ \\t]*\\([^;(){}]{0,120}\\)${AFTER_PARAMS})`,
          scope: 'function',
        },

        {
          match:
            '\\b(?:move|forward|make_shared|make_unique|swap|begin|end|to_string|printf|snprintf|memcpy|strlen|malloc|free|exit|assert)\\b(?=[ \\t]*\\()',
          scope: 'function.builtin',
        },
        // Before the constant and type rules, so a SCREAMING_CASE macro used as
        // `CLAMP(x, 0, 9)` reads as the call it expands to.
        { match: `\\b${ID}(?=[ \\t]*\\()`, scope: 'function.call' },

        // SCREAMING_CASE is a macro or an enumerator; `_t` and CapWords are the
        // two ways a C++ codebase spells a type.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: `\\b${ID}_t\\b`, scope: 'type' },
        { match: '\\b[A-Z]\\w*\\b', scope: 'type' },
        // Below the type rules, so `Ring::make()` keeps `Ring` a type while
        // `ring::detail::flush()` reads as the namespace path it is.
        { match: '\\b[a-z_]\\w*(?=::)', scope: 'namespace' },

        // ---- numbers ---------------------------------------------------------
        // `'` is a digit separator here. These rules start at the digit, which
        // is to the left of the first quote, so the leftmost-match rule hands
        // `1'048'576` to them rather than to the character literal above.
        // Hex first: `0x1p-3` is a float, and the decimal rule would stop at the
        // `0`. Octal needs no rule of its own — `0755` is a number either way.
        {
          match: `\\b0[xX][0-9a-fA-F']+(?:\\.[0-9a-fA-F']*)?(?:[pP][-+]?\\d+)?${SUFFIX}\\b`,
          scope: 'number',
        },
        { match: `\\b0[bB][01']+${SUFFIX}\\b`, scope: 'number' },
        {
          match: `\\b\\d[\\d']*(?:\\.[\\d']*)?(?:[eE][-+]?\\d+)?${SUFFIX}\\b`,
          scope: 'number',
        },
        {
          match: `\\.\\d[\\d']*(?:[eE][-+]?\\d+)?${SUFFIX}\\b`,
          scope: 'number',
        },

        // ---- syntax ----------------------------------------------------------
        // `<=>` before `<=`, and the pointer-to-member pair before plain `.`
        // and `*`. The member rules above already took `.name`, so `.` only
        // reaches here as an operator.
        {
          match: '<=>|->\\*|\\.\\*|->|::|\\+\\+|--|<<=?|>>=?|&&|\\|\\||\\.{3}|[-+*/%&|^!=<>]=?|[?~]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    /**
     * From the `)` of a constructor's parameter list to the first entry of its
     * member-initialiser list.
     *
     * Entered only on a lookahead that has already seen that whole shape, so
     * these rules just have to name the pieces it allows — which is what keeps
     * `noexcept` a keyword instead of unscoped filler. The entry name pops the
     * state, and every later entry is caught by the `,` rule back in `root`.
     */
    'member-init': {
      rules: [
        // Ahead of the name rule, so a qualifier is not read as the first
        // entry. `final` and `override` are contextual keywords rather than
        // reserved words, so they are also legal member names — the `(` guard
        // is what lets `: final(f)` reach the entry rule below. `const` rides
        // along in the same guard for symmetry — it cannot legally be a member
        // name. `noexcept` and `try` stay unguarded because `noexcept(true)`
        // is a real qualifier and neither can be named.
        {
          match: '\\b(?:const|override|final)\\b(?![ \\t]*\\()',
          scope: 'keyword.declaration',
        },
        { match: '\\bnoexcept\\b', scope: 'keyword.operator' },
        { match: '\\btry\\b', scope: 'keyword.control' },
        { match: '&&?', scope: 'operator' },
        { match: ':', scope: 'punctuation.delimiter' },
        { match: `${ID}(?=[ \\t]*\\()`, scope: 'function.call', pop: true },
        // Nothing else can appear between the `)` and the first entry, so
        // anything that does means the lookahead that pushed this state was
        // wrong about the construct. Leave before the body rather than run to
        // the end of the file with every later scope suppressed.
        { match: '(?=[{;])', pop: true },
      ],
    },

    /** Block comments. C++ does not nest them, so these do not push themselves. */
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
        { match: ESCAPE, scope: 'string.escape' },
        { match: FORMAT, scope: 'string.special' },
        // The closer takes any user-defined literal suffix with it: `"a"s`,
        // `"path"sv`. Doing it here rather than back in `root` is what keeps a
        // lookbehind out of the root alternation — a rule that starts with one
        // costs the merged regex its first-character scan, and that was worth
        // 1.5-2x throughput across the whole grammar.
        {
          match: `(")(${ID})?`,
          scope: ['string', 'string.special'],
          pop: true,
        },
        // An unterminated literal ends at the line break instead of swallowing
        // the rest of the file. A continued one does not reach here: the
        // backslash-newline is an escape, and it matches first.
        { match: '$', pop: true },
      ],
    },

    /**
     * The body of `R"tag(…)tag"`. Nothing in it is escaped, so the state has one
     * rule — and that rule cannot check the delimiter, because tying the closer
     * to the opener needs a backreference and the compiler rejects those. Any
     * `)tag"` closes, which is exact for the common `R"(…)"` and wrong only for
     * a tagged literal whose body contains a differently tagged closer. There is
     * no `$` escape hatch: a raw string spanning lines is the point of one.
     */
    'raw-string': {
      default: 'string',
      // The closer carries any user-defined literal suffix, exactly as the
      // plain string state does.
      rules: [
        {
          match: `(\\)[^()\\\\\\s]{0,16}")(${ID})?`,
          scope: ['string', 'string.special'],
          pop: true,
        },
      ],
    },
  },
}

export default cpp
