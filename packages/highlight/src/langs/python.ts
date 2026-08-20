import type { Grammar } from '../core/types'

/**
 * Python.
 *
 * The parts that most highlighters flatten into one color, and that this
 * grammar keeps apart:
 *
 * - f-string interpolations are real expressions, with the braces, `!r`
 *   conversions and `:>10.2f` format specs each scoped separately
 * - parameters are tracked through a state machine, so annotations and default
 *   values are not mistaken for parameter names (and vice versa)
 * - `self`/`cls`, dunder names, builtins and builtin types are distinct from
 *   ordinary identifiers
 * - docstrings read as documentation, not as string literals
 *
 * Ordinary identifiers deliberately match no rule: they inherit the block's
 * foreground, which keeps both the markup and the visual noise down.
 */

const ID = '[A-Za-z_\\u0080-\\uFFFF][\\w\\u0080-\\uFFFF]*'

/** `\n`, `\x41`, `☃`, `\N{BULLET}`, `\033`. */
const ESCAPE =
  '\\\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|N\\{[^}\\n]*\\}|[0-7]{1,3}|\\r?\\n|[\\\\\'"abfnrtv0])'

/** printf-style placeholders — still everywhere in real Python. */
const PERCENT_FORMAT = '%[-+ #0]*(?:\\d+|\\*)?(?:\\.(?:\\d+|\\*))?[hlL]?[diouxXeEfFgGcrsa%]'

const python: Grammar = {
  name: 'python',
  aliases: ['py', 'python3'],
  states: {
    root: {
      rules: [{ include: 'statement' }, { include: 'expression' }],
    },

    // ---- statement-level constructs ----------------------------------------
    statement: {
      rules: [
        { match: '^#!.*', scope: 'comment' },

        // A triple quote at the start of a line is, in practice, always a
        // docstring: a string used as a value is preceded by `name = `.
        {
          match: '^[ \\t]*"""',
          scope: 'comment.doc',
          push: 'docstring-double',
        },
        {
          match: "^[ \\t]*'''",
          scope: 'comment.doc',
          push: 'docstring-single',
        },

        {
          match: `^([ \\t]*)(@${ID}(?:\\.${ID})*)`,
          scope: [null, 'decorator'],
        },

        // Consume the opening paren so parameters get their own state.
        {
          match: `\\b(def)([ \\t]+)(${ID})([ \\t]*)(\\()`,
          scope: ['keyword.declaration', null, 'function', null, 'punctuation.bracket'],
          push: 'params',
        },
        {
          match: `\\b(class)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },

        {
          match: `\\b(from|import)([ \\t]+)(${ID}(?:\\.${ID})*)`,
          scope: ['keyword.import', null, 'namespace'],
        },
        { match: '\\b(?:import|from)\\b', scope: 'keyword.import' },

        // `match`/`case` are soft keywords: only treat them as control flow in
        // the statement shape that introduces a block.
        {
          match: '^([ \\t]*)(match|case)\\b(?=[^\\n]*:[ \\t]*(?:#[^\\n]*)?$)',
          scope: [null, 'keyword.control'],
        },
      ],
    },

    // ---- expressions -------------------------------------------------------
    expression: {
      rules: [
        { match: '#[^\\n]*', scope: 'comment' },

        { include: 'strings' },
        { include: 'numbers' },

        { match: '\\.\\.\\.', scope: 'constant.builtin' },

        // Matched at the dot, so `obj.print` never reads as the builtin.
        {
          match: `(\\.)([ \\t]*)(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', null, 'function.method'],
        },
        {
          match: '(\\.)([ \\t]*)(__\\w+__)',
          scope: ['punctuation', null, 'variable.special'],
        },
        {
          match: `(\\.)([ \\t]*)(${ID})`,
          scope: ['punctuation', null, 'variable.member'],
        },

        {
          match: '\\b(?:None|True|False|NotImplemented|Ellipsis)\\b',
          scope: 'constant.builtin',
        },
        { match: '\\b(?:self|cls|super)\\b', scope: 'variable.builtin' },

        {
          match:
            '\\b(?:if|elif|else|for|while|break|continue|return|yield|await|raise|try|except|finally|with|pass|assert|del)\\b',
          scope: 'keyword.control',
        },
        {
          match: '\\blambda\\b',
          scope: 'keyword.declaration',
          push: 'lambda-params',
        },
        {
          match: '\\b(?:def|class|async|global|nonlocal)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:and|or|not|in|is)\\b', scope: 'keyword.operator' },
        { match: '\\bas\\b', scope: 'keyword' },

        { match: '\\b__\\w+__\\b', scope: 'variable.special' },

        {
          match:
            '\\b(?:abs|aiter|anext|all|any|ascii|bin|breakpoint|callable|chr|classmethod|compile|delattr|dir|divmod|enumerate|eval|exec|filter|format|getattr|globals|hasattr|hash|help|hex|id|input|isinstance|issubclass|iter|len|locals|map|max|min|next|oct|open|ord|pow|print|property|range|repr|reversed|round|setattr|slice|sorted|staticmethod|sum|vars|zip)\\b',
          scope: 'function.builtin',
        },
        {
          match:
            '\\b(?:bool|bytearray|bytes|complex|dict|float|frozenset|int|list|memoryview|object|set|str|tuple|type)\\b',
          scope: 'type.builtin',
        },

        // SCREAMING_CASE reads as a constant; CapWords as a type. Between them
        // these cover module constants, classes and the whole exception
        // hierarchy without shipping a name list.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },

        // PEP 8 puts no spaces around a keyword argument's `=` and spaces
        // around an assignment's, which makes them tellable apart.
        { match: `\\b${ID}(?==(?!=))`, scope: 'variable.parameter' },
        { match: `\\b${ID}(?=[ \\t]*\\()`, scope: 'function.call' },

        {
          match: '->|:=|\\*\\*=?|//=?|<<=?|>>=?|[-+*/%@&|^~<>!=]=?',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    numbers: {
      rules: [
        { match: '\\b0[xX](?:_?[0-9a-fA-F])+\\b', scope: 'number' },
        { match: '\\b0[oO](?:_?[0-7])+\\b', scope: 'number' },
        { match: '\\b0[bB](?:_?[01])+\\b', scope: 'number' },
        {
          match:
            '\\b\\d(?:_?\\d)*\\.(?:\\d(?:_?\\d)*)?(?:[eE][-+]?\\d(?:_?\\d)*)?[jJ]?|\\.\\d(?:_?\\d)*(?:[eE][-+]?\\d(?:_?\\d)*)?[jJ]?|\\b\\d(?:_?\\d)*(?:[eE][-+]?\\d(?:_?\\d)*)?[jJ]?\\b',
          scope: 'number',
        },
      ],
    },

    // ---- strings -----------------------------------------------------------
    // Prefixes are scoped separately so `rb"..."` reads as a modifier on the
    // literal rather than as part of it.
    strings: {
      rules: [
        {
          match: '(?:[rR][fF]|[fF][rR]?)(""")',
          scope: ['string'],
          rest: 'string.special',
          push: 'fstring-triple-double',
        },
        {
          match: "(?:[rR][fF]|[fF][rR]?)(''')",
          scope: ['string'],
          rest: 'string.special',
          push: 'fstring-triple-single',
        },
        {
          match: '(?:[rR][fF]|[fF][rR]?)(")',
          scope: ['string'],
          rest: 'string.special',
          push: 'fstring-double',
        },
        {
          match: "(?:[rR][fF]|[fF][rR]?)(')",
          scope: ['string'],
          rest: 'string.special',
          push: 'fstring-single',
        },

        {
          match: '(?:[rRbBuU]|[rR][bB]|[bB][rR])?(""")',
          scope: ['string'],
          rest: 'string.special',
          push: 'string-triple-double',
        },
        {
          match: "(?:[rRbBuU]|[rR][bB]|[bB][rR])?(''')",
          scope: ['string'],
          rest: 'string.special',
          push: 'string-triple-single',
        },
        {
          match: '(?:[rRbBuU]|[rR][bB]|[bB][rR])?(")',
          scope: ['string'],
          rest: 'string.special',
          push: 'string-double',
        },
        {
          match: "(?:[rRbBuU]|[rR][bB]|[bB][rR])?(')",
          scope: ['string'],
          rest: 'string.special',
          push: 'string-single',
        },
      ],
    },

    'string-body': {
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: PERCENT_FORMAT, scope: 'string.special' },
      ],
    },

    'string-double': {
      default: 'string',
      rules: [
        { include: 'string-body' },
        { match: '"', scope: 'string', pop: true },
        // An unterminated single-quote string ends at the line break instead of
        // swallowing the rest of the file.
        { match: '$', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      rules: [{ include: 'string-body' }, { match: "'", scope: 'string', pop: true }, { match: '$', pop: true }],
    },
    'string-triple-double': {
      default: 'string',
      rules: [{ include: 'string-body' }, { match: '"""', scope: 'string', pop: true }],
    },
    'string-triple-single': {
      default: 'string',
      rules: [{ include: 'string-body' }, { match: "'''", scope: 'string', pop: true }],
    },

    'docstring-double': {
      default: 'comment.doc',
      rules: [{ match: '"""', pop: true }],
    },
    'docstring-single': {
      default: 'comment.doc',
      rules: [{ match: "'''", pop: true }],
    },

    // ---- f-strings ---------------------------------------------------------
    'fstring-body': {
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        // Doubled braces are literal text, not an interpolation.
        { match: '\\{\\{|\\}\\}', scope: 'string.escape' },
        { match: '\\{', scope: 'interpolation', push: 'interpolation' },
      ],
    },

    'fstring-double': {
      default: 'string',
      rules: [{ include: 'fstring-body' }, { match: '"', scope: 'string', pop: true }, { match: '$', pop: true }],
    },
    'fstring-single': {
      default: 'string',
      rules: [{ include: 'fstring-body' }, { match: "'", scope: 'string', pop: true }, { match: '$', pop: true }],
    },
    'fstring-triple-double': {
      default: 'string',
      rules: [{ include: 'fstring-body' }, { match: '"""', scope: 'string', pop: true }],
    },
    'fstring-triple-single': {
      default: 'string',
      rules: [{ include: 'fstring-body' }, { match: "'''", scope: 'string', pop: true }],
    },

    interpolation: {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        // `f"{value=}"` — self-documenting expressions.
        { match: '=(?=[!:}])', scope: 'string.special' },
        // `!r` conversion and everything from `:` to the closing brace is a
        // format spec, not more expression. The length cap is what keeps an
        // unclosed `{` cheap: the scan runs to the end of the line and then
        // fails the lookahead, once per `:`, so an uncapped one is quadratic on
        // a run of colons. No real spec — `:>8.2f`, `:%H:%M:%S` — comes close
        // to the bound.
        { match: '![rsa](?=[:}])', scope: 'string.special' },
        { match: ':[^{}\\n]{0,120}(?=\\})', scope: 'string.special' },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { match: '\\[', scope: 'punctuation.bracket', push: 'bracket' },
        { include: 'expression' },
      ],
    },

    // ---- balanced nesting --------------------------------------------------
    // Used wherever a `,` or `)` means something structural, so a comma inside
    // `Dict[str, int]` does not end a parameter.
    paren: {
      rules: [{ match: '\\)', scope: 'punctuation.bracket', pop: true }, { include: 'nested' }],
    },
    bracket: {
      rules: [{ match: '\\]', scope: 'punctuation.bracket', pop: true }, { include: 'nested' }],
    },
    brace: {
      rules: [{ match: '\\}', scope: 'punctuation.bracket', pop: true }, { include: 'nested' }],
    },
    nested: {
      rules: [
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { match: '\\[', scope: 'punctuation.bracket', push: 'bracket' },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },

    // ---- parameters --------------------------------------------------------
    params: {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        // `self`/`cls` keep their identity in a signature.
        { match: '\\b(?:self|cls)\\b', scope: 'variable.builtin' },
        { match: ':', scope: 'punctuation.delimiter', push: 'param-value' },
        { match: '=(?!=)', scope: 'operator', push: 'param-value' },
        // The anchor sits *inside* the alternation rather than in front of it.
        // Unanchored, the rule restarts an unbounded identifier scan at every
        // column of a long name and goes quadratic whenever the lookahead fails
        // — an unclosed `(`, which is what an editor sees mid-keystroke. Either
        // the sigil or a "not already inside a name" position has to be there,
        // and the `(?:…)` keeps `\*{1,2}` as group 1 so the scope array still
        // lines up with the captures.
        //
        // The lookbehind spells out the identifier characters rather than using
        // `\b`, because `\b` is ASCII-only while `ID` is not: `def f(π)` has no
        // word boundary in front of `π`, so a `\b` would stop scoping it.
        {
          match: `(?:(\\*{1,2})[ \\t]*|(?<![\\w\\u0080-\\uFFFF]))(${ID})(?=[ \\t]*[,:=)])`,
          scope: ['operator', 'variable.parameter'],
        },
        { include: 'nested' },
      ],
    },

    /** An annotation or a default: expression syntax, but no parameter names. */
    'param-value': {
      rules: [{ match: '(?=[,)]|=(?!=))', pop: true }, { include: 'nested' }],
    },

    'lambda-params': {
      rules: [
        { match: ':', scope: 'punctuation.delimiter', pop: true },
        { match: '=(?!=)', scope: 'operator', push: 'param-value' },
        // Anchored for the same reason as the `params` rule above.
        {
          match: `(?:(\\*{1,2})[ \\t]*|(?<![\\w\\u0080-\\uFFFF]))(${ID})(?=[ \\t]*[,:=])`,
          scope: ['operator', 'variable.parameter'],
        },
        { match: '$', pop: true },
        { include: 'nested' },
      ],
    },
  },
}

export default python
