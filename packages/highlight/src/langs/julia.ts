import type { Grammar } from '../core/types'

/**
 * Julia.
 *
 * Things worth knowing about:
 *
 * - `'` is both a character literal and the transpose operator. It opens a
 *   literal only where a value cannot end — not after a name, a closing
 *   bracket, a number or another `'` — so `A'` and `x'y` stay operators.
 * - `:` is a range, a ternary branch and the start of a symbol. A symbol needs
 *   a name straight after the colon and nothing value-like straight before it,
 *   which keeps `1:n` and `a ? b : c` out.
 * - Interpolation is real: `"$(user.name) has $n items"` tokenizes the
 *   expressions. Prefixed string macros (`r"…"`, `raw"…"`, `b"…"`) do not
 *   interpolate, so they get a state without it.
 * - Block comments `#= … =#` nest.
 * - Names may end in `!` (`push!`) and carry Unicode (`α`, `∇f`).
 */

const ID = '[A-Za-z_\\u00A1-\\uFFFF][\\w!\\u00A1-\\uFFFF]{0,128}'

/** Something after which `'` is a transpose rather than a character literal. */
const VALUE_END = "[\\w)\\]}'.\\u00A1-\\uFFFF]"

const julia: Grammar = {
  name: 'julia',
  aliases: ['jl'],
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        { match: '#=', scope: 'comment', push: 'block-comment' },
        { match: '#[^\\n]*', scope: 'comment' },

        // ---- strings -------------------------------------------------------
        { match: '"""', scope: 'string', push: 'string-triple' },
        {
          match: `(${ID})(""")`,
          scope: ['string.special', 'string'],
          push: 'string-raw-triple',
        },
        { match: `(${ID})(")`, scope: ['string.special', 'string'], push: 'string-raw' },
        { match: '"', scope: 'string', push: 'string' },
        { match: '`', scope: 'string', push: 'command' },
        {
          // The lookbehind sits after the quote so the rule still starts with a
          // literal character, which keeps the engine's first-character scan.
          match: `'(?<!${VALUE_END}')(?:[^'\\\\\\n]|\\\\(?:x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{1,4}|U[0-9a-fA-F]{1,8}|[0-7]{1,3}|[^\\n]))'`,
          scope: 'string',
        },

        // ---- numbers -------------------------------------------------------
        { match: '\\b0x[0-9a-fA-F_]+(?:p[-+]?\\d+)?\\b', scope: 'number' },
        { match: '\\b0b[01_]+\\b', scope: 'number' },
        { match: '\\b0o[0-7_]+\\b', scope: 'number' },
        {
          match: '(?:\\b\\d[\\d_]*(?:\\.(?!\\.)[\\d_]*)?|\\.\\d[\\d_]*)(?:[eEf][-+]?\\d+)?(?:im\\b)?',
          scope: 'number',
        },

        // ---- macros, symbols and types -------------------------------------
        { match: `@${ID}(?:\\.${ID})*`, scope: 'decorator' },
        {
          match: `(:(?<![\\w)\\]}:'".\\u00A1-\\uFFFF]:))(${ID})`,
          scope: ['constant', 'constant'],
        },
        {
          match: `(::|<:|>:)([ \\t]*)(${ID}(?:\\.${ID})*)`,
          scope: ['operator', null, 'type'],
        },

        // ---- definitions ---------------------------------------------------
        {
          match: `\\b(function|macro)([ \\t]+)(${ID}(?:\\.${ID})*)`,
          scope: ['keyword.declaration', null, 'function'],
        },
        {
          match: `\\b((?:mutable[ \\t]+)?struct|abstract[ \\t]+type|primitive[ \\t]+type)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        {
          match: `\\b((?:bare)?module)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'namespace'],
        },
        // The short form `area(r) = π * r^2` defines a function. The argument
        // list cannot hold parentheses here, which covers the one-liners this
        // form is used for and keeps the scan bounded.
        {
          match: `^([ \\t]*)(${ID})(?=\\([^()\\n]{0,256}\\)[ \\t]*(?:where[^=\\n]{0,256})?=(?!=))`,
          scope: [null, 'function'],
        },

        // ---- keywords ------------------------------------------------------
        {
          match: '\\b(?:if|elseif|else|end|for|while|break|continue|return|try|catch|finally|do|begin|let|quote)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:function|macro|struct|mutable|abstract|primitive|type|module|baremodule|const|global|local|where|outer)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:using|import|export|public|as)\\b', scope: 'keyword.import' },
        { match: '\\b(?:in|isa)\\b', scope: 'keyword.operator' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\b(?:nothing|missing|NaN|Inf|NaN32|Inf32|undef|stdout|stderr|stdin)\\b', scope: 'constant.builtin' },

        // ---- calls ---------------------------------------------------------
        {
          match:
            '\\b(?:println|print|show|display|string|length|size|push!|pop!|append!|map|filter|reduce|sum|prod|maximum|minimum|collect|typeof|isa|convert|parse|zeros|ones|rand|round|floor|ceil|abs|sqrt|exp|log|error|throw|isempty|haskey|get|keys|values|pairs|enumerate|zip|sort|sort!|occursin|replace|split|join|startswith|endswith|open|read|write|close|eachline|readline|readlines|sprint|repr|Dict|Vector|Array|Tuple)(?=\\.?\\()',
          scope: 'function.builtin',
        },
        { match: `(\\.)(${ID})(?=\\.?\\()`, scope: ['punctuation', 'function.method'] },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },
        // `f(x)` and the broadcast `f.(x)`.
        { match: `${ID}(?=\\.?\\()`, scope: 'function.call' },

        // CapWords reads as a type, which is how Julia names them.
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },

        // ---- syntax --------------------------------------------------------
        {
          match: "\\.?(?:===|!==|==|!=|<=|>=|=>|->|\\|\\||&&|\\|>|<\\||\\.\\.\\.|[-+*/\\\\^%÷<>=!&|~⊻∈∉≤≥≠]=?)|'",
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;]', scope: 'punctuation.delimiter' },
        { match: '[.:?]', scope: 'punctuation' },
      ],
    },

    'block-comment': {
      default: 'comment',
      rules: [
        { match: '#=', scope: 'comment', push: 'block-comment' },
        { match: '=#', scope: 'comment', pop: true },
      ],
    },

    // ---- strings -------------------------------------------------------------
    string: {
      default: 'string',
      rules: [{ include: 'escapes' }, { include: 'interpolation' }, { match: '"', scope: 'string', pop: true }],
    },
    'string-triple': {
      default: 'string',
      rules: [{ include: 'escapes' }, { include: 'interpolation' }, { match: '"""', scope: 'string', pop: true }],
    },
    /** Prefixed string macros: no interpolation, and `\"` is the only escape. */
    'string-raw': {
      default: 'string',
      rules: [
        { match: '\\\\"', scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    'string-raw-triple': {
      default: 'string',
      rules: [{ match: '"""', scope: 'string', pop: true }],
    },
    command: {
      default: 'string',
      rules: [{ include: 'escapes' }, { include: 'interpolation' }, { match: '`', scope: 'string', pop: true }],
    },

    escapes: {
      rules: [
        {
          match: '\\\\(?:x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{1,4}|U[0-9a-fA-F]{1,8}|[0-7]{1,3}|[\\s\\S])',
          scope: 'string.escape',
        },
      ],
    },
    interpolation: {
      rules: [
        { match: '\\$\\(', scope: 'interpolation', push: 'interpolation-body' },
        { match: `(\\$)(${ID})`, scope: ['interpolation', 'variable'] },
      ],
    },
    /** The expression inside `$( … )`. Nested parentheses are tracked. */
    'interpolation-body': {
      rules: [
        { match: '\\)', scope: 'interpolation', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'parens' },
        { include: 'expression' },
      ],
    },
    parens: {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'parens' },
        { include: 'expression' },
      ],
    },
  },
}

export default julia
