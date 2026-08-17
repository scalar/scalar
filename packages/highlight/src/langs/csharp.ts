import type { Grammar } from '../core/types'

/**
 * C#.
 *
 * The four things that make C# awkward for a regex tokenizer, and how this
 * grammar answers them:
 *
 * - **Five string flavours.** `"…"`, verbatim `@"…"` where the only escape is a
 *   doubled quote, interpolated `$"…"`, the combination `$@"…"`, and C# 11 raw
 *   `"""…"""`. Each gets its own state, so a `\` in a verbatim string is text
 *   and a `{` in a plain string is not an interpolation.
 * - **Everything is PascalCase.** Types, methods, properties and namespaces all
 *   share one casing convention, so casing alone cannot tell them apart the way
 *   it can in Python or Rust. Position does the work instead: what follows the
 *   name (`(`, `{`, `=>`, `.`) and what precedes it.
 * - **A method definition looks exactly like a call**, right down to the parens.
 *   The separator is the return type in front of it, matched with a lookbehind
 *   so the type itself still gets scoped by the type rules.
 * - **Contextual keywords.** `get`, `set`, `record`, `when`, `and` and the LINQ
 *   words are only keywords in some positions and ordinary identifiers in
 *   others. They are treated as keywords everywhere, which is right for
 *   idiomatic code — see the notes on the rules that make that trade.
 */

const ID = '[A-Za-z_]\\w*'

/** A dotted name: `System.Text.Json`. */
const DOTTED = `${ID}(?:\\.${ID})*`

/**
 * One level of type arguments, used only inside lookarounds.
 *
 * `<` is excluded from the body and the repetition is capped so a line of `<`
 * cannot be rescanned from every column. Nested arguments (`List<List<int>>`)
 * therefore fail the lookahead and fall through to the plainer rules, which is
 * a missed colour rather than a wrong one.
 */
const GENERIC = '<[^<>()\\n]{0,120}>'

/** `\n`, `\t`, `\uFFFD`, `\U0001F600`, `\x41`, `\"`. */
const ESCAPE = '\\\\(?:u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]{1,4}|[0abfnrtve\'"\\\\])'

/**
 * A name in a statement position that is not the start of a declaration.
 *
 * The definition and property rules key off "a word, a space, then the name",
 * which is also the shape of `return Compute(x)` and `await Run()`. Excluding
 * the keywords that can stand where a type would keeps those as calls. `=>` is
 * excluded too, because a generic return type ends in `>` as well.
 */
const NOT_AFTER =
  '(?<=[\\w>\\]?][ \\t])(?<!=>[ \\t])' +
  '(?<!\\b(?:return|new|await|throw|yield|is|as|in|out|ref|case|when|and|or|not|else|do|using|typeof|nameof|default)[ \\t])'

const csharp: Grammar = {
  name: 'csharp',
  aliases: ['cs', 'c#'],
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        // `///` is the XML documentation comment; `//` is an ordinary one.
        { match: '///[^\\n]*', scope: 'comment.doc' },
        { match: '//[^\\n]*', scope: 'comment' },
        // A state, not a lazy `[\\s\\S]*?` scan: that form runs to EOF and fails
        // once per opener, which is O(n2) on an unterminated `/*` — 123 KB of
        // `/*a` measured 23.4 s. C# block comments do not nest.
        { match: '/\\*', scope: 'comment', push: 'block-comment' },

        // Preprocessor directives. Only the directive itself is scoped so that
        // `#if DEBUG` and `#pragma warning disable CS1591` keep their operands
        // highlighted as the constants they are.
        { match: '^([ \\t]*)(#[ \\t]*[a-z]+)', scope: [null, 'decorator'] },

        { include: 'strings' },

        // An attribute, recognised by sitting on its own line. `[` anywhere
        // else is an indexer or an array, and a line that opens with `[` in the
        // middle of an expression is rare enough to accept as the cost. Only
        // the name is scoped, so `[Route("api/[controller]")]` still shows its
        // string.
        {
          match: `(^[ \\t]*)(\\[)(${DOTTED})`,
          scope: [null, 'punctuation.bracket', 'decorator'],
        },

        { include: 'numbers' },

        // `..` before the member rules, so `items[1..n]` does not read the
        // second dot as access to a member named `n`.
        { match: '\\.\\.', scope: 'operator' },
        {
          match: `(\\??\\.)([ \\t]*)(${ID})(?=[ \\t]*(?:${GENERIC})?[ \\t]*\\()`,
          scope: ['punctuation', null, 'function.method'],
        },
        {
          match: `(\\??\\.)([ \\t]*)(${ID})`,
          scope: ['punctuation', null, 'variable.member'],
        },

        {
          match: `\\b(using)([ \\t]+)(?:(static)([ \\t]+))?(${DOTTED})(?=[ \\t]*;)`,
          scope: ['keyword.import', null, 'keyword.declaration', null, 'namespace'],
        },
        {
          match: `\\b(namespace)([ \\t]+)(${DOTTED})`,
          scope: ['keyword.declaration', null, 'namespace'],
        },
        // The optional `record ` prefix keeps `record struct Point` from
        // scoping `struct` as if it were the type name.
        {
          match: `\\b((?:record[ \\t]+)?(?:class|struct|interface|enum|delegate|record))([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        // `new` names a type, never a function, so it comes before the rules
        // that read `Name(` as a call.
        {
          match: `\\b(new)([ \\t]+)(${DOTTED})`,
          scope: ['keyword.operator', null, 'type'],
        },

        {
          match:
            '\\b(?:if|else|for|foreach|while|do|switch|case|default|break|continue|return|goto|throw|try|catch|finally|yield|await|lock|when|from|select|orderby|join|into)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:class|struct|interface|enum|record|delegate|namespace|var|const|readonly|volatile|static|public|private|protected|internal|abstract|sealed|virtual|override|partial|async|event|extern|unsafe|fixed|implicit|explicit|operator|params|ref|out|where|get|set|init|required|global)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\busing\\b', scope: 'keyword.import' },
        {
          match: '\\b(?:is|as|in|new|typeof|sizeof|nameof|stackalloc|checked|unchecked|with|and|or|not)\\b',
          scope: 'keyword.operator',
        },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnull\\b', scope: 'constant.builtin' },
        { match: '\\b(?:this|base)\\b', scope: 'variable.builtin' },
        {
          match:
            '\\b(?:bool|byte|sbyte|char|decimal|double|float|int|uint|long|ulong|short|ushort|nint|nuint|object|string|void|dynamic)\\b',
          scope: 'type.builtin',
        },

        // A verbatim identifier — `@class`, `@event` — is a name, not the
        // keyword it spells.
        { match: `@${ID}`, scope: 'variable' },

        // A type in a declaration, recognised by the name that follows it:
        // `HttpClient _client;`, `List<int> xs = …`, `catch (IOException ex)`,
        // `IClock Clock {`, `Task<string> RunAsync(`. Keywords are matched
        // above, so `return Compute(x)` cannot read `return` as a type here;
        // the inner guard is for the ones that can follow a value instead of
        // introducing a name, as in `c is (…)` and `state switch {`.
        {
          match: `\\b${ID}(?=(?:${GENERIC})?(?:\\[\\])*\\??[ \\t]+(?!(?:is|as|in|when|and|or|not|switch|with)\\b)${ID}[ \\t]*[=;,){(])`,
          scope: 'type',
        },

        // A definition, told from a call by the return type (or the access
        // modifier of a constructor) sitting in front of it.
        {
          match: `${NOT_AFTER}${ID}(?=[ \\t]*(?:${GENERIC})?[ \\t]*\\()`,
          scope: 'function',
        },
        // A property or expression-bodied member: same shape, but `{` or `=>`
        // where a method has its parameter list. Scoped as a member so it looks
        // the same at its declaration as it does at `obj.Name`.
        {
          match: `${NOT_AFTER}${ID}(?=[ \\t]*(?:\\{|=>))`,
          scope: 'variable.member',
        },
        {
          match: `\\b${ID}(?=[ \\t]*(?:${GENERIC})?[ \\t]*\\()`,
          scope: 'function.call',
        },
        { match: `\\b${ID}(?=[ \\t]*=>)`, scope: 'variable.parameter' },

        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        // A PascalCase name in front of a dot is the receiver of a member
        // access, and in C# that is almost always a type: locals and parameters
        // are camelCase by convention. `Name.Length` on a property of `this` is
        // what this gets wrong.
        { match: '\\b[A-Z]\\w*(?=\\.)', scope: 'type' },

        {
          match: '=>|\\?\\?=?|\\?\\.|::|\\+\\+|--|&&|\\|\\||<<=?|>>=?|[-+*/%&|^!=<>]=?|[?~^]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    numbers: {
      rules: [
        {
          match: '\\b0[xX](?:_?[0-9a-fA-F])+(?:[uU][lL]?|[lL][uU]?)?\\b',
          scope: 'number',
        },
        {
          match: '\\b0[bB](?:_?[01])+(?:[uU][lL]?|[lL][uU]?)?\\b',
          scope: 'number',
        },
        // Real literals carry a suffix (`10m`, `1.5f`) that is part of the
        // number, and `.5f` may start with the dot.
        {
          match:
            '\\b\\d(?:_?\\d)*\\.\\d(?:_?\\d)*(?:[eE][-+]?\\d+)?[fFdDmM]?|\\.\\d(?:_?\\d)*(?:[eE][-+]?\\d+)?[fFdDmM]?|\\b\\d(?:_?\\d)*(?:[eE][-+]?\\d+)?(?:[fFdDmM]|[uU][lL]?|[lL][uU]?)?\\b',
          scope: 'number',
        },
      ],
    },

    // ---- strings -------------------------------------------------------------
    // Prefixes are scoped separately so `$@` reads as a modifier on the literal
    // rather than as part of it. Longest opener first: `"""` before `"`.
    strings: {
      rules: [
        {
          match: '(\\$)(""")',
          scope: ['string.special', 'string'],
          push: 'raw-interpolated',
        },
        { match: '"""', scope: 'string', push: 'raw' },
        {
          match: '(\\$@|@\\$)(")',
          scope: ['string.special', 'string'],
          push: 'verbatim-interpolated',
        },
        {
          match: '(@)(")',
          scope: ['string.special', 'string'],
          push: 'verbatim',
        },
        {
          match: '(\\$)(")',
          scope: ['string.special', 'string'],
          push: 'interpolated',
        },
        { match: '"', scope: 'string', push: 'string' },
        // A char literal, escapes included. One rule rather than a state: it is
        // always a single character and always closes on the same line.
        { match: `'(?:[^'\\\\\\n]|${ESCAPE})'`, scope: 'string' },
      ],
    },

    /** Block comments. C# does not nest them, so this does not push itself. */
    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', pop: true }],
    },

    string: {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
        // A plain literal cannot span lines, so an unterminated one ends at the
        // line break instead of swallowing the rest of the file.
        { match: '$', pop: true },
      ],
    },
    interpolated: {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { include: 'holes' },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },

    // Verbatim literals span lines and have exactly one escape: `""`. A
    // backslash in them is an ordinary character, which is the whole point of
    // writing `@"C:\temp"`.
    verbatim: {
      default: 'string',
      rules: [
        { match: '""', scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    'verbatim-interpolated': {
      default: 'string',
      rules: [
        { match: '""', scope: 'string.escape' },
        { include: 'holes' },
        { match: '"', scope: 'string', pop: true },
      ],
    },

    // Raw literals have no escapes at all: the closing `"""` is the only thing
    // that ends them, which is what lets them hold quotes verbatim.
    raw: {
      default: 'string',
      rules: [{ match: '"""', scope: 'string', pop: true }],
    },
    'raw-interpolated': {
      default: 'string',
      rules: [{ include: 'holes' }, { match: '"""', scope: 'string', pop: true }],
    },

    /** The `{…}` holes shared by every interpolated flavour. */
    holes: {
      rules: [
        // Doubled braces are literal text, not a hole.
        { match: '\\{\\{|\\}\\}', scope: 'string.escape' },
        { match: '\\{', scope: 'interpolation', push: 'interpolation' },
      ],
    },

    interpolation: {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        // `{total,-8:N2}` — the alignment and the format spec are string syntax,
        // not expression syntax. Parens are excluded from the spec so the `:` of
        // `{(ok ? "y" : "n")}` stays a ternary. The length cap keeps an unclosed
        // `{` cheap: the scan runs to the end of the line and then fails the
        // lookahead, once per `:`, so an uncapped one is quadratic on a run of
        // colons. No real spec — `N2`, `yyyy-MM-dd HH:mm:ss` — is near the bound.
        { match: ',[ \\t]*-?\\d+(?=[:}])', scope: 'string.special' },
        { match: ':[^{}()"\\n]{0,120}(?=\\})', scope: 'string.special' },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },
    /** Tracks brace depth so `$"{new Foo { A = 1 }}"` keeps its states straight. */
    brace: {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },
  },
}

export default csharp
