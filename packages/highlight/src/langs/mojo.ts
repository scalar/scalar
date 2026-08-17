import type { Grammar } from '../core/types'

/**
 * Mojo.
 *
 * Mojo is Python's syntax with a systems language underneath it, so this
 * grammar is shaped like the Python one and then answers the questions Python
 * never has to ask:
 *
 * - a signature can carry a compile-time parameter list in `[]` *and* a runtime
 *   argument list in `()`, so `fn`/`def` push a small signature state that
 *   walks both and then reads what follows as a return type
 * - argument conventions (`owned`, `borrowed`, `inout`, `mut`, `read`, `out`,
 *   `ref`) are keywords only inside a signature; `read` and `out` are ordinary
 *   names everywhere else and are left alone
 * - `struct` and `trait` replace `class`, and the types worth knowing are
 *   `Int`, `SIMD` and `DType` rather than `int` and `float`
 * - f-string interpolations are real expressions, with the braces and the
 *   `:>10.2f` format specs scoped apart from the literal text
 *
 * Ordinary identifiers deliberately match no rule: they inherit the block's
 * foreground, which keeps both the markup and the visual noise down.
 */

const ID = '[A-Za-z_\\u0080-\\uFFFF][\\w\\u0080-\\uFFFF]*'

/** `\n`, `\x41`, `☃`, `\033` — Mojo inherits Python's escape set. */
const ESCAPE = '\\\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[0-7]{1,3}|\\r?\\n|[\\\\\'"abfnrtv0])'

/**
 * Argument conventions. They are only keywords when a name follows, which is
 * what keeps `read` and `out` usable as parameter names in the same list —
 * `f(out=1)` names an argument, `f(out result: Int)` declares a convention.
 */
const CONVENTION = '\\b(?:owned|borrowed|inout|mut|read|out|ref)\\b(?=[ \\t]+[*A-Za-z_])'

const mojo: Grammar = {
  name: 'mojo',
  aliases: ['🔥'],
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

        // Anchored to the line so `@parameter` reads as a decorator while the
        // `@` of a matrix product stays an operator.
        {
          match: `^([ \\t]*)(@${ID}(?:\\.${ID})*)`,
          scope: [null, 'decorator'],
        },

        {
          match: `\\b(fn|def)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'function'],
          push: 'signature',
        },

        // A struct's `[]` holds parameters, but its `()` holds the traits it
        // conforms to — `struct Matrix[rows: Int](Copyable)`. Only the bracket
        // list gets the parameter state; the paren list is left to the
        // expression rules, where those names read as types.
        {
          match: `\\b(struct|trait)([ \\t]+)(${ID})([ \\t]*)(\\[)`,
          scope: ['keyword.declaration', null, 'class', null, 'punctuation.bracket'],
          push: 'params',
        },
        {
          match: `\\b(struct|trait)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },

        {
          match: `\\b(from|import)([ \\t]+)(${ID}(?:\\.${ID})*)`,
          scope: ['keyword.import', null, 'namespace'],
        },
        { match: '\\b(?:import|from)\\b', scope: 'keyword.import' },
      ],
    },

    /**
     * Between a function's name and the `:` that opens its body.
     *
     * `(` both switches this state for `return-type` and pushes the argument
     * list, so when that list pops the grammar is already past the arguments —
     * that is what keeps the `Int` in `-> List[Int]:` a type instead of another
     * parameter name.
     */
    signature: {
      rules: [
        { match: '\\[', scope: 'punctuation.bracket', push: 'params' },
        {
          match: '\\(',
          scope: 'punctuation.bracket',
          set: 'return-type',
          push: 'params',
        },
        { match: ':', scope: 'punctuation.delimiter', pop: true },
        // A half-typed `fn` must not swallow the rest of the file.
        { match: '$', pop: true },
      ],
    },

    'return-type': {
      rules: [
        { match: ':', scope: 'punctuation.delimiter', pop: true },
        { match: '$', pop: true },
        { include: 'expression' },
      ],
    },

    // ---- expressions -------------------------------------------------------
    expression: {
      rules: [
        { match: '#[^\\n]*', scope: 'comment' },

        { include: 'strings' },
        { include: 'numbers' },

        { match: '\\.\\.\\.', scope: 'constant.builtin' },

        // Matched at the dot, so `obj.print` never reads as the builtin. A
        // parametric method call — `p.load[4]()` — is read as a member instead,
        // because `.data[0]` is the far more common shape.
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

        { match: '\\bNone\\b', scope: 'constant.builtin' },
        { match: '\\b(?:True|False)\\b', scope: 'boolean' },
        { match: '\\b(?:self|cls)\\b', scope: 'variable.builtin' },

        {
          match:
            '\\b(?:if|elif|else|for|while|break|continue|return|yield|await|raise|try|except|finally|with|pass|assert|del)\\b',
          scope: 'keyword.control',
        },
        {
          match: '\\b(?:fn|def|struct|trait|alias|var|let|async|global|nonlocal|lambda)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:raises|capturing|as)\\b', scope: 'keyword' },
        { match: '\\b(?:and|or|not|in|is)\\b', scope: 'keyword.operator' },

        { match: '\\b__\\w+__\\b', scope: 'variable.special' },

        {
          match:
            '\\b(?:abs|align_?of|all|any|bin|chr|constrained|debug_assert|enumerate|hex|isinstance|len|max|min|oct|open|ord|pow|print|range|rebind|repr|reversed|round|simd_?width_?of|size_?of|sorted|str|sum|swap|zip)\\b',
          scope: 'function.builtin',
        },
        // `U?Int(?:8|16|32|64)?` collapses the ten sized integers into one
        // branch. Only the primitives are listed: the stdlib traits and the
        // rarer collections are CapWords, so the heuristic below already reads
        // them as types and listing them would buy a shade of colour per name.
        {
          match:
            '\\b(?:U?Int(?:8|16|32|64)?|Float(?:16|32|64)|SIMD|Scalar|DType|Bool|String(?:Literal|Slice)?|List|Dict|Set|Tuple|Optional|UnsafePointer|Pointer|AnyType|Error|Self)\\b',
          scope: 'type.builtin',
        },

        // SCREAMING_CASE reads as a constant; CapWords as a type. Between them
        // these cover module constants, structs, traits and aliases without
        // shipping a name list.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },

        // Mojo keeps PEP 8, so a keyword argument's `=` has no spaces around it
        // and an assignment's does, which makes them tellable apart.
        { match: `\\b${ID}(?==(?!=))`, scope: 'variable.parameter' },
        { match: `\\b${ID}(?=[ \\t]*\\()`, scope: 'function.call' },

        // `^` is Mojo's transfer sigil as well as xor; both are operators.
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
            '\\b\\d(?:_?\\d)*\\.(?:\\d(?:_?\\d)*)?(?:[eE][-+]?\\d(?:_?\\d)*)?|\\.\\d(?:_?\\d)*(?:[eE][-+]?\\d(?:_?\\d)*)?|\\b\\d(?:_?\\d)*(?:[eE][-+]?\\d(?:_?\\d)*)?\\b',
          scope: 'number',
        },
      ],
    },

    // ---- strings -----------------------------------------------------------
    // Prefixes are scoped separately so `rf"..."` reads as a modifier on the
    // literal rather than as part of it. Every flavour then shares one body:
    // a `{}` is a compile-time interpolation in an f-string and a runtime
    // placeholder in an argument to `String.format`, and neither is literal
    // text, so one set of states covers both instead of two near-copies.
    strings: {
      rules: [
        {
          match: '[rRfF]{0,2}(""")',
          scope: ['string'],
          rest: 'string.special',
          push: 'string-triple-double',
        },
        {
          match: "[rRfF]{0,2}(''')",
          scope: ['string'],
          rest: 'string.special',
          push: 'string-triple-single',
        },
        {
          match: '[rRfF]{0,2}(")',
          scope: ['string'],
          rest: 'string.special',
          push: 'string-double',
        },
        {
          match: "[rRfF]{0,2}(')",
          scope: ['string'],
          rest: 'string.special',
          push: 'string-single',
        },
      ],
    },

    'string-body': {
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        // Doubled braces are literal text, not an interpolation.
        { match: '\\{\\{|\\}\\}', scope: 'string.escape' },
        { match: '\\{', scope: 'interpolation', push: 'interpolation' },
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

    interpolation: {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        // Everything from `:` to the closing brace is a format spec, not more
        // expression. The length cap is what keeps an unclosed `{` cheap: the
        // scan is retried at every `:` on the line, so an uncapped one is
        // quadratic on a run of colons. No real spec — `:>10.2f`, `:%H:%M:%S`
        // — comes close to the bound.
        { match: ':[^{}\\n]{0,120}(?=\\})', scope: 'string.special' },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { match: '\\[', scope: 'punctuation.bracket', push: 'bracket' },
        { include: 'expression' },
      ],
    },

    // ---- balanced nesting --------------------------------------------------
    // Used wherever a `,` or `)` means something structural, so a comma inside
    // `SIMD[DType.float32, 4]` does not end a parameter.
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
    // Shared by the `[]` parameter list and the `()` argument list: both are
    // `name: type = default` separated by commas, and both close on a bracket.
    params: {
      rules: [
        { match: '[)\\]]', scope: 'punctuation.bracket', pop: true },
        { match: CONVENTION, scope: 'keyword' },
        // `self` keeps its identity in a signature.
        { match: '\\b(?:self|cls)\\b', scope: 'variable.builtin' },
        { match: ':', scope: 'punctuation.delimiter', push: 'param-value' },
        { match: '=(?!=)', scope: 'operator', push: 'param-value' },
        // No leading `[ \t]*`: a pattern that can start on the whitespace in
        // front of a name matches further left than the `self` rule above and
        // would win on position, turning the `self` of `inout self` into an
        // ordinary parameter.
        //
        // The anchor sits *inside* the alternation rather than in front of it.
        // Unanchored, the rule restarts an unbounded identifier scan at every
        // column of a long name and goes quadratic. Either the sigil or a "not
        // already inside a name" position has to be there, and the `(?:…)` keeps
        // `\*{1,2}` as group 1 so the scope array still lines up with the
        // captures.
        //
        // The lookbehind spells out the identifier characters rather than using
        // `\b`, because `\b` is ASCII-only while `ID` is not: `fn f(π)` has no
        // word boundary in front of `π`, so a `\b` would stop scoping it.
        {
          match: `(?:(\\*{1,2})|(?<![\\w\\u0080-\\uFFFF]))(${ID})(?=[ \\t]*[,:=)\\]])`,
          scope: ['operator', 'variable.parameter'],
        },
        { include: 'nested' },
      ],
    },

    /** An annotation or a default: expression syntax, but no parameter names. */
    'param-value': {
      rules: [{ match: '(?=[,)\\]]|=(?!=))', pop: true }, { include: 'nested' }],
    },
  },
}

export default mojo
