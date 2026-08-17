import type { Grammar } from '../core/types'

/**
 * Clojure, ClojureScript and EDN.
 *
 * Clojure has no statement syntax to key off — everything is a list — so the
 * one piece of structure this grammar leans on is *head position*: the symbol
 * directly after `(` is the thing being called. Every head-position rule is a
 * lookbehind (`(?<=\()`) rather than a rule that eats the paren, so the bracket
 * keeps its own `punctuation.bracket` token and priority order still decides
 * whether `(if …)` reads as control flow or as a call.
 *
 * What it keeps apart that a one-color-per-list highlighter does not:
 *
 * - a `def…` name at its definition site (`function`, `class` or `variable`,
 *   depending on which form introduced it) versus the same symbol at a call site
 * - a `defn` docstring as documentation, versus a string used as a value
 * - reader forms — `#"…"` regexes, `\newline` chars, `#(…)`, `#?(:clj …)`,
 *   `#_`, metadata — which all begin with a character that means something else
 *   on its own
 * - Java interop: `System/nanoTime` splits into a builtin type, a separator and
 *   a method, and `.length` / `.-field` read as a method and a field
 *
 * Known gaps, all of them cases where a regex cannot know the answer:
 *
 * - `#_` scopes only the discard marker; the form it throws away still
 *   highlights, because skipping it means balancing an arbitrary form.
 * - Binding vectors are not parsed, so `[x y]` parameters read as plain symbols.
 * - Any head-position symbol starting with `def` reads as a declaration. That is
 *   right for the `def…` macro family (`defroutes`, `defstate`, …) and wrong for
 *   a symbol that merely starts with those three letters.
 * - Keyword literals are always `constant`, including the ones used as map keys.
 * - A quoted list is still a list, so the head of `'(a b c)` reads as a call.
 */

/** Characters allowed inside a symbol or keyword name. `/` and `:` separate names, so they stay out. */
const TAIL = "[\\w*+!?<>=&%$|.'#-]"

/** A name cannot start with a digit, `'` or `#` — those begin other reader forms. */
const NAME = `[A-Za-z*+!_?<>=&%$|.-]${TAIL}*`

/**
 * Word boundaries for a language whose symbols are full of punctuation, where
 * `\b` means nothing useful. They also anchor every unanchored rule below to the
 * start of a name, so no pattern can be retried at each character of a long one.
 */
const PREV = "(?<![\\w*+!?<>=&%$|.'#:/-])"
const NEXT = "(?![\\w*+!?<>=&%$|.'#:/-])"

/** `^:private` or `^String` sitting between a `def…` form and the name it introduces. */
const META = `(?:(\\^:?${TAIL}+)(\\s+))?`

/** The string a `defn`/`ns` form may carry directly after its name. Anchored to that name, never scanned for on its own. */
const DOCSTRING = `(?:(\\s+)("(?:[^"\\\\]|\\\\[\\s\\S])*"))?`

/** Java classes common enough in Clojure source to be worth telling from a user type. */
const JAVA = 'String|Integer|Long|Double|Boolean|Object|Number|Class|Exception|Throwable|Math|System|Thread'

const clojure: Grammar = {
  name: 'clojure',
  aliases: ['clj', 'cljs', 'cljc', 'edn'],
  states: {
    root: {
      rules: [
        { match: '^#!.*', scope: 'comment' },
        { match: ';[^\\n]*', scope: 'comment' },
        // Only the marker: see the "known gaps" note above.
        { match: '#_', scope: 'comment' },

        // A char literal can hold the character that starts a comment, a string
        // or a list. It wins over all three because it starts one position
        // earlier — at the backslash — and the scanner takes the leftmost match.
        {
          match: '\\\\(?:newline|space|tab|formfeed|backspace|return|u[0-9a-fA-F]{4}|o[0-7]{1,3}|\\S)',
          scope: 'string',
        },

        { match: '#"', scope: 'regexp', push: 'regexp' },
        { match: '"', scope: 'string', push: 'string' },

        // `#?(:clj …)` / `#?@(:cljs …)` — reader conditionals pick a platform,
        // so only the marker is a keyword; the branches highlight as usual.
        { match: '#\\?@?', scope: 'keyword' },
        // `#'foo` is a var reference. Matched with its symbol because the `'`
        // would otherwise block the symbol rules below.
        { match: `(#')(${NAME})`, scope: ['operator', 'variable'] },
        // `#(` opens an anonymous function and `#{` a set; both are still brackets.
        { match: '#[({]', scope: 'punctuation.bracket' },
        { match: `#[A-Za-z]${TAIL}*`, scope: 'type' },

        { match: `\\^:?${TAIL}+`, scope: 'decorator' },
        // `^{:doc "…"}` — the map form. Leaving the caret alone lets its contents highlight.
        { match: '\\^', scope: 'operator' },

        { match: '##(?:-?Inf|NaN)', scope: 'number' },
        // Radix and ratio come first: `2r1011` and `22/7` both start with digits
        // that the decimal branch would happily claim on its own.
        {
          match: `${PREV}[-+]?(?:\\d+[rR][0-9a-zA-Z]+|0[xX][0-9a-fA-F]+N?|\\d+/\\d+|(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?[MN]?)`,
          scope: 'number',
        },

        // `[clojure.string :as str]` — the alias names a namespace, and every
        // later `str/…` is scoped as one, so it should not read as a builtin.
        {
          match: `(:as)(\\s+)(${NAME})`,
          scope: ['constant', null, 'namespace'],
        },
        // `:kw`, `::auto-resolved`, `:my.ns/kw`. Matched before the head-position
        // rules so `(:name person)` reads as a keyword lookup, not as a call.
        { match: `${PREV}::?${TAIL}+(?:/${TAIL}+)?`, scope: 'constant' },

        // ---- definition sites --------------------------------------------------
        // The name is scoped by what introduced it, which is the whole reason
        // these are four rules and not one.
        {
          match: `(?<=\\()(def(?:record|type|protocol|interface|struct))(\\s+)${META}(${NAME})`,
          scope: ['keyword.declaration', null, 'decorator', null, 'class'],
        },
        {
          match: `(?<=\\()(def(?:n-?|m(?:acro|ulti|ethod)|test))(\\s+)${META}(${NAME})${DOCSTRING}`,
          scope: ['keyword.declaration', null, 'decorator', null, 'function', null, 'comment.doc'],
        },
        {
          match: `(?<=\\()(def(?:once)?)(\\s+)${META}(${NAME})`,
          scope: ['keyword.declaration', null, 'decorator', null, 'variable'],
        },
        {
          match: `(?<=\\()(ns)(\\s+)${META}(${NAME})${DOCSTRING}`,
          scope: ['keyword.import', null, 'decorator', null, 'namespace', null, 'comment.doc'],
        },
        // Anything else in the `def…` family, including user macros.
        { match: `(?<=\\()def${TAIL}*${NEXT}`, scope: 'keyword.declaration' },

        // ---- Java interop in head position -------------------------------------
        {
          match: `(?<=\\()(\\.-)(${NAME})`,
          scope: ['punctuation', 'variable.member'],
        },
        {
          match: `(?<=\\()(\\.)(${NAME})`,
          scope: ['punctuation', 'function.method'],
        },

        { match: `${PREV}nil${NEXT}`, scope: 'constant.builtin' },
        { match: `${PREV}(?:true|false)${NEXT}`, scope: 'boolean' },

        {
          match: `${PREV}(?:if(?:-not|-let|-some)?|when(?:-not|-let|-some|-first)?|condp?|case|do(?:seq|times|all|run)?|for|loop|recur|while|try|catch|finally|throw)${NEXT}`,
          scope: 'keyword.control',
        },
        {
          match: `${PREV}(?:fn|let(?:fn)?|binding|reify|proxy|declare|set!|var|new|extend-(?:type|protocol))${NEXT}`,
          scope: 'keyword.declaration',
        },
        // Threading macros compose expressions, so they read as operators rather
        // than as the calls they expand into.
        {
          match: `${PREV}(?:(?:some|cond)?->>?|as->|and|or|not)${NEXT}`,
          scope: 'keyword.operator',
        },
        {
          match: `${PREV}(?:require|import|use|refer(?:-clojure)?|in-ns|load)${NEXT}`,
          scope: 'keyword.import',
        },
        {
          match: `${PREV}(?:not=|[<>]=?|=|[-+*/]|rem|quot|mod)${NEXT}`,
          scope: 'operator',
        },

        {
          match: `${PREV}(?:mapv?|filter|reduce|apply|into|conj|assoc(?:-in)?|dissoc|get(?:-in)?|update(?:-in)?|merge|count|first|second|rest|last|nth|take|drop|range|str|keyword|name|println|vec|vector|list|set|seq|sort(?:-by)?|concat|empty\\?|nil\\?|some|every\\?|contains\\?|inc|dec|swap!|reset!|atom|partial|comp|juxt)${NEXT}`,
          scope: 'function.builtin',
        },

        // ---- types -------------------------------------------------------------
        // `System/nanoTime` before bare `System`, so the member half is not lost.
        {
          match: `${PREV}(${JAVA})(/)(${NAME})`,
          scope: ['type.builtin', 'punctuation.delimiter', 'function.method'],
        },
        {
          match: `${PREV}([A-Z]${TAIL}*)(/)(${NAME})`,
          scope: ['type', 'punctuation.delimiter', 'function.method'],
        },
        { match: `${PREV}(?:${JAVA})${NEXT}`, scope: 'type.builtin' },
        // CapWords is a type by convention. `(Point. 1 2)` keeps its trailing dot
        // in the same token, which is what makes it read as a constructor.
        { match: `${PREV}[A-Z]${TAIL}*`, scope: 'type' },
        // A dotted lowercase symbol is a namespace or a Java package: `clojure.string`.
        { match: `${PREV}[a-z][\\w-]*(?:\\.[\\w-]+)+`, scope: 'namespace' },

        // ---- head position -----------------------------------------------------
        // Last of the name rules, so keywords, builtins and types have all had
        // their turn: whatever is left in head position is a call.
        {
          match: `(?<=\\()(?:(${NAME})(/))?(${NAME})`,
          scope: ['namespace', 'punctuation.delimiter', 'function.call'],
        },
        {
          match: `${PREV}(${NAME})(/)`,
          scope: ['namespace', 'punctuation.delimiter'],
        },

        // `%`, `%1`, `%&` — the implicit parameters of `#(…)`.
        { match: `${PREV}%(?:\\d+|&)?`, scope: 'variable.parameter' },
        { match: `${PREV}&${NEXT}`, scope: 'operator' },
        // Quote, syntax-quote, unquote and deref. `PREV` keeps the `'` inside a
        // symbol like `x'` from reading as a quote of its own.
        { match: `${PREV}(?:~@|[~@'\`])`, scope: 'operator' },

        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        // Commas are whitespace in Clojure, and are used exactly like one.
        { match: ',', scope: 'punctuation.delimiter' },
      ],
    },

    string: {
      default: 'string',
      // Strings are multi-line, so there is no line-end escape hatch here.
      rules: [
        { match: '\\\\(?:u[0-9a-fA-F]{4}|[\\s\\S])', scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
      ],
    },

    regexp: {
      default: 'regexp',
      rules: [
        { match: '\\\\[\\s\\S]', scope: 'string.escape' },
        { match: '"', scope: 'regexp', pop: true },
        // Regex literals are written on one line in practice; bailing at the line
        // end keeps an unterminated `#"` from swallowing the rest of the file.
        { match: '$', pop: true },
      ],
    },
  },
}

export default clojure
