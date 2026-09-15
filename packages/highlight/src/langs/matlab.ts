import type { Grammar } from '../core/types'

/**
 * MATLAB (and, near enough, Octave).
 *
 * Four things make MATLAB awkward for a regex tokenizer, and each one is
 * handled explicitly here:
 *
 * - The apostrophe is both the transpose operator and the char-array quote.
 *   `A'` transposes, `'A'` is a literal. What separates them is only what came
 *   *before*, so a lookbehind decides: an apostrophe following an identifier
 *   character, `)`, `]`, `}`, `"` or another `'` is transpose, and everything
 *   else opens a literal. That rule sits ahead of the string rules so the
 *   operator wins the tie.
 * - `end` closes a block *and* names the last index. Every bracket pushes a
 *   state, and inside one `end` is a value rather than a keyword — which is
 *   exactly the distinction MATLAB itself makes.
 * - Block comments are delimited by `%{` and `%}` alone on their own lines, and
 *   the same characters mid-line are an ordinary comment. Both delimiters are
 *   line-anchored, and the body is a state rather than a backreferenced scan.
 * - `properties`, `methods` and `arguments` are contextual: `properties(obj)`
 *   is a function call. They only read as keywords when they open a block,
 *   which here means they end their line (an attribute list aside).
 *
 * Ordinary identifiers deliberately match no rule. MATLAB has no naming
 * convention a highlighter can lean on — `A` and `B` are matrices far more
 * often than they are classes — so the CapWords/SCREAMING_CASE heuristics other
 * grammars here use would be wrong more often than right.
 *
 * What it knowingly gets wrong: command syntax. In `hold on` and `warning off`
 * the bare words are string arguments, and nothing in the line says so, so they
 * render as plain identifiers.
 */

/** MATLAB names start with a letter; the cap bounds lookahead rules. */
const ID = '[A-Za-z]\\w{0,63}'

/**
 * Integers, floats, exponents, the `i`/`j` imaginary suffix and the `0x`/`0b`
 * literals added in R2019b. Their `u8`/`s16` type suffixes are left out: they
 * are vanishingly rare, and a suffixed literal simply renders unscoped.
 *
 * The trailing guard is `(?!\w)` rather than `(?![\w.])` on purpose: `1.5.^2`
 * is a real expression, and a dot-excluding guard would refuse to see the
 * number in front of the element-wise operator.
 *
 * A trailing dot joins the literal only when no dot operator follows it, which
 * is what `(?![*\/\\^'])` guards. `2./x` therefore splits the way MATLAB itself
 * splits it, as `2` and `./`, and — the reason the guard is not optional —
 * `2.'` reads as `2` and the non-conjugate transpose. Letting the literal eat
 * the dot there leaves the `'` with a `.` behind it, which the transpose
 * lookbehind rejects, so the apostrophe would open a char array and swallow the
 * rest of the line.
 */
const NUMBER =
  '(?<![\\w.])(?:0[xX][0-9a-fA-F]+|0[bB][01]+|' +
  "(?:\\d+(?:\\.(?:\\d+|(?![*/\\\\^'])))?|\\.\\d+)(?:[eE][-+]?\\d+)?[ijIJ]?)(?!\\w)"

/** The block-opening keywords, plus Octave's `do`/`until`. */
const CONTROL =
  '\\b(?:if|elseif|else|end|switch|case|otherwise|for|parfor|while|do|until|' + 'break|continue|return|try|catch)\\b'

/** What `class()` answers for a builtin, and the constructor of the same name. */
const TYPES = '\\b(?:double|single|u?int(?:8|16|32|64)|logical|char|string|cell|struct|table|datetime)\\b'

/**
 * Base functions worth their bytes.
 *
 * The list is deliberately short. Anything left out still reads as a call
 * wherever a `(` follows, so a name only earns a place if a reader expects to
 * recognise it even when it is passed by handle — `cellfun(@numel, c)`. The
 * graphics and toolbox families are left out entirely for that reason.
 */
const BUILTINS =
  '\\b(?:' +
  'zeros|ones|eye|rand[in]?|linspace|size|numel|length|reshape|repmat|' +
  'sum|prod|mean|std|min|max|abs|sqrt|exp|log(?:2|10)?|sin|cos|tan|' +
  'floor|ceil|round|mod|sort|unique|find|any|all|' +
  'is(?:empty|nan|inf|a|field|char|numeric|logical|string|struct|cell|equal|member)|' +
  'class|cellfun|arrayfun|disp|fprintf|sprintf|error|warning|assert|' +
  'str(?:cmpi?|rep|split|join|trim|cat|2double|2func)|(?:num|mat)2str|' +
  'regexp(?:rep)?|contains|upper|lower|inv|diff|plot|figure|tic|toc' +
  ')\\b'

/**
 * printf placeholders. MATLAB itself never interprets them, but `fprintf`,
 * `sprintf` and `error` are where format strings live, so they are worth
 * calling out wherever they appear.
 *
 * Every repetition is capped. `0` is both a flag and a digit, so with `*`
 * quantifiers a long run of them backtracks against the width group at every
 * split — seconds of work for `'%00000…'`, on a string an untrusted document
 * can contain.
 */
const FORMAT = '%[-+ #0]{0,8}(?:\\d{1,6}|\\*)?(?:\\.(?:\\d{1,6}|\\*))?[diouxXeEfgGcs%]'

/**
 * `.*`, `./`, `.\`, `.^` and the non-conjugate transpose `.'` all begin with a
 * dot, so they are one alternative; the trailing `[&|:@.]` picks up `:` (a
 * range, not a delimiter), `@` and the bare dot of `s.(name)`.
 */
const OPERATOR = "\\.[*/\\\\^']|&&|\\|\\||[-+*/\\\\^~<>=]=?|[&|:@.]"

const matlab: Grammar = {
  name: 'matlab',
  aliases: ['m', 'octave'],
  states: {
    root: {
      rules: [{ include: 'statement' }, { include: 'expression' }, { include: 'brackets' }],
    },

    // ---- statement-level constructs ----------------------------------------
    statement: {
      rules: [
        // Contextual block keywords. `properties(obj)` and `methods(obj)` are
        // ordinary calls, so these only count when the name opens its own line
        // and nothing but an attribute list and a comment follow it.
        //
        // The trailing whitespace run is written once, with the second one
        // tucked inside the optional attribute list behind the mandatory `)`.
        // Two `[ \t]*` in a row with an optional group between them let the
        // engine enumerate every split of a whitespace run whenever `$` fails,
        // which is quadratic on `properties` followed by spaces and one more
        // character — a line an untrusted document can contain.
        {
          match:
            '^([ \\t]*)(arguments|properties|methods|events|enumeration)\\b' +
            '(?=[ \\t]*(?:\\([^)\\n]{0,120}\\)[ \\t]*)?(?:[%#][^\\n]*)?$)',
          scope: [null, 'keyword.declaration'],
        },

        // The superclass list is its own state so `handle` and a dotted mixin
        // read as types rather than as variables.
        {
          match: `\\b(classdef)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
          push: 'superclass',
        },
        // `classdef (Sealed) Foo` puts attributes before the name; the name is
        // left unscoped there rather than growing the rule.
        { match: '\\bclassdef\\b', scope: 'keyword.declaration' },

        {
          match: '\\bfunction\\b',
          scope: 'keyword.declaration',
          push: 'func-decl',
        },

        // `import pkg.Class`. The path falls through to the member rules rather
        // than getting a namespace rule of its own — MATLAB code imports rarely
        // enough that the extra pattern is not worth its bytes.
        { match: '\\bimport\\b', scope: 'keyword.import' },
      ],
    },

    // ---- expressions -------------------------------------------------------
    expression: {
      rules: [
        { include: 'comments' },

        // The whole transpose-versus-quote decision, and it has to come before
        // the string rules so the operator wins when both could match. `"` is
        // in the class because `"abc"'` transposes a string scalar; the only
        // way to reach a `'` with a `"` behind it is straight after a
        // double-quoted literal closed, so it cannot open one either.
        { match: "(?<=[\\w)\\]}'\"])'", scope: 'operator' },
        { match: "'", scope: 'string', push: 'char-array' },
        { match: '"', scope: 'string', push: 'string-double' },

        { match: NUMBER, scope: 'number' },

        // Matched at the dot so `obj.size` never reads as the builtin. MATLAB
        // cannot tell `obj.method(x)` from indexing a property, and neither can
        // this: a following `(` wins and the property reads as a method.
        {
          match: `(\\.)(${ID})(?=\\()`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },

        // `@(x) …` — the parameter list gets the same state a signature does.
        {
          match: '(@)([ \\t]*)(\\()',
          scope: ['keyword.declaration', null, 'punctuation.bracket'],
          push: 'params',
        },

        { match: CONTROL, scope: 'keyword.control' },
        { match: '\\b(?:global|persistent)\\b', scope: 'keyword.declaration' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        {
          match: '\\b(?:pi|Inf|inf|NaN|nan|NaT|eps)\\b',
          scope: 'constant.builtin',
        },
        {
          match: '\\b(?:nargin|nargout|varargin|varargout|ans)\\b',
          scope: 'variable.builtin',
        },

        { match: TYPES, scope: 'type.builtin' },
        { match: BUILTINS, scope: 'function.builtin' },

        // A named handle, `@myfun`. Listed after the builtins so `@mean` keeps
        // its builtin colour; the `@` itself is consumed by the operator rule.
        { match: `(?<=@)${ID}`, scope: 'function.call' },

        // MATLAB spells indexing and calling the same way, so `x(3)` on an
        // array reads as a call. Every highlighter makes this trade; requiring
        // the `(` to be adjacent at least keeps `size (1,1)` in an `arguments`
        // block from looking like one.
        { match: `\\b${ID}(?=\\()`, scope: 'function.call' },

        { match: OPERATOR, scope: 'operator' },
      ],
    },

    /**
     * Bracket openers push, so the state stack knows whether an `end` is
     * closing a block or naming the last index.
     */
    brackets: {
      rules: [
        { match: '[(\\[{]', scope: 'punctuation.bracket', push: 'group' },
        // A closer with no opener — mismatched source, or a prefix an editor is
        // still typing. Scoped, but it must not pop past the state it is in.
        { match: '[)\\]}]', scope: 'punctuation.bracket' },
        // Inside `[…]` a `;` ends a matrix row rather than a statement, but it
        // separates either way.
        { match: '[,;]', scope: 'punctuation.delimiter' },
      ],
    },

    /**
     * Anything inside `(…)`, `[…]` or `{…}`, where `end` is the last index.
     *
     * One state serves all three: which closer arrives is only interesting on
     * malformed source, and paying for three near-identical states to notice
     * `f(x]` is not worth it.
     */
    group: {
      rules: [
        { match: '[)\\]}]', scope: 'punctuation.bracket', pop: true },
        // `[~, idx] = max(v)` discards an output. A `~` immediately followed by
        // a separator cannot be negating anything, so it is a placeholder name
        // rather than the not operator.
        { match: '~(?=[ \\t]*[,\\]])', scope: 'variable.parameter' },
        { include: 'nested' },
      ],
    },

    nested: {
      rules: [{ match: '\\bend\\b', scope: 'constant.builtin' }, { include: 'expression' }, { include: 'brackets' }],
    },

    // ---- declarations ------------------------------------------------------
    /**
     * A `function` signature, up to the end of its line. Both output forms live
     * here: `[a, b] = f(x)` and `y = f(x)`, plus the bare `function f(x)`.
     */
    'func-decl': {
      rules: [
        { include: 'comments' },
        // The signature ends with its line. A `...` continuation is matched by
        // `comments` above, and that rule swallows the newline, so this cannot
        // pop in the middle of a wrapped parameter list.
        { match: '$', pop: true },
        // `function y = f(x), y = 1; end` puts the whole definition on one
        // line. Every comma inside the output or parameter list belongs to the
        // `params` state, so a separator seen here is already past the
        // signature and the body starts after it.
        { match: '[,;]', scope: 'punctuation.delimiter', pop: true },

        { match: '\\[', scope: 'punctuation.bracket', push: 'params' },
        // A name in front of the `=` is the single output, not the function.
        { match: `(${ID})(?=[ \\t]*=(?!=))`, scope: ['variable.parameter'] },
        { match: '=', scope: 'operator' },

        {
          match: `(${ID})([ \\t]*)(\\()`,
          scope: ['function', null, 'punctuation.bracket'],
          push: 'params',
        },
        { match: ID, scope: 'function' },
        // Keeps the bracket balanced for shapes this state does not model, such
        // as the `function v = get.Prop(obj)` property getter.
        { match: '\\(', scope: 'punctuation.bracket', push: 'params' },
      ],
    },

    /**
     * Names in a signature: the `[a, b]` output list, and the parameters of both
     * `function f(a, b)` and `@(a, b)`. One state covers both because MATLAB
     * puts defaults in an `arguments` block rather than the signature, so every
     * bare name in either list is a name and nothing else. A `~` stands in for
     * one that is being discarded.
     */
    params: {
      rules: [
        { match: '[)\\]]', scope: 'punctuation.bracket', pop: true },
        { include: 'comments' },
        { match: `[~]|${ID}`, scope: 'variable.parameter' },
        { match: ',', scope: 'punctuation.delimiter' },
        // An unclosed list must not turn the rest of the file into parameters.
        { match: '$', pop: true },
      ],
    },

    /** Everything after `classdef Name`: `< handle & pkg.Mixin`. */
    superclass: {
      rules: [
        { include: 'comments' },
        { match: '$', pop: true },
        // A superclass list is separated by `&`, so a `,` or `;` here ends the
        // header — `classdef Foo < handle, end` is a legal one-line class and
        // its `end` closes the block rather than naming a mixin.
        { match: '[,;]', scope: 'punctuation.delimiter', pop: true },
        { match: '[<&]', scope: 'operator' },
        { match: `${ID}(?:\\.${ID}){0,8}`, scope: 'type' },
      ],
    },

    // ---- comments ----------------------------------------------------------
    comments: {
      rules: [
        // `%{` only opens a block when it is alone on its line; anywhere else it
        // is an ordinary comment. Nesting is not modelled — the first `%}` on
        // its own line closes the block.
        {
          match: '^([ \\t]*)([%#]\\{[ \\t]*)$',
          scope: [null, 'comment'],
          push: 'block-comment',
        },
        // `%%` at the start of a line opens a code section, which editors treat
        // as a heading rather than as a note.
        { match: '^([ \\t]*)((?:%%|##)[^\\n]*)', scope: [null, 'comment.doc'] },
        // `#` is Octave's comment character and means nothing in MATLAB, so
        // accepting it costs one character and cannot misfire.
        { match: '[%#][^\\n]*', scope: 'comment' },
        // A `...` continuation comments out the rest of its line. The newline is
        // consumed with it so states that end at `$` see the logical line, not
        // the physical one.
        {
          match: '(\\.\\.\\.)([^\\n]*)(\\n?)',
          scope: ['punctuation', 'comment', null],
        },
      ],
    },

    'block-comment': {
      default: 'comment',
      rules: [{ match: '^[ \\t]*[%#]\\}[ \\t]*$', pop: true }],
    },

    // ---- strings -----------------------------------------------------------
    'string-body': {
      rules: [
        // MATLAB does not interpret backslash escapes in a literal — only the
        // printf family does, and that is where they overwhelmingly appear, so
        // showing them is right on ordinary code and wrong on `disp('a\nb')`.
        {
          match: '\\\\(?:x[0-9a-fA-F]{1,2}|[0-7]{1,3}|[nrtfvab0\\\\\'"%])',
          scope: 'string.escape',
        },
        { match: FORMAT, scope: 'string.special' },
      ],
    },

    /** A single-quoted char array. The quote is escaped by doubling it. */
    'char-array': {
      default: 'string',
      rules: [
        { match: "''", scope: 'string.escape' },
        { include: 'string-body' },
        { match: "'", scope: 'string', pop: true },
        // A literal cannot span lines, so an unterminated one ends with its
        // line instead of swallowing the file.
        { match: '$', pop: true },
      ],
    },

    /** A double-quoted string, escaping its quote the same way. */
    'string-double': {
      default: 'string',
      rules: [
        { match: '""', scope: 'string.escape' },
        { include: 'string-body' },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },
  },
}

export default matlab
