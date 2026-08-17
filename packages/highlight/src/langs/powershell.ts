import type { Grammar } from '../core/types'

/**
 * PowerShell.
 *
 * Every state is case-insensitive because the language is: `ForEach`, `foreach`
 * and `FOREACH` are one keyword, so the word lists are spelled in lowercase
 * once instead of enumerating both cases. That is also why `[a-z_]` is enough
 * to start an identifier here.
 *
 * The four things that make PowerShell awkward for a regex tokenizer, and what
 * this grammar does about them:
 *
 * - A leading `-` is three different things. `Get-ChildItem` is a command name,
 *   `-eq` is an operator and `-Recurse` is a parameter. They are matched in
 *   that order, so the longest, most structural reading always wins.
 * - Double-quoted strings interpolate `$var`, `${var}` and whole `$( ... )`
 *   expressions, and escape with a backtick rather than a backslash.
 * - Here-strings (`@"` ... `"@`) run to a terminator that has to start a line.
 * - `[Something]` is a type when it closes and an attribute when a `(` follows,
 *   which is the only difference between `[string]` and `[Parameter(...)]`.
 *
 * Where a regex cannot know, this takes the reading that is right on ordinary
 * scripts and wrong on these: an unquoted hyphenated word in argument position
 * reads as a command (`Content-Type = 'x'`), a class constructor reads as a
 * call rather than a definition, a bare path picks up a member (`.\b.ps1`), and
 * a type literal nested more than one level deep (`[List[List[int]]]`) falls
 * back to plain brackets.
 */

/** Identifiers are case-insensitive, so `[a-z_]` covers `[A-Za-z_]` here. */
const ID = '[a-z_]\\w*'

/**
 * Word-shaped operators, including the `-c`/`-i` case-sensitivity prefixes.
 * The trailing `\b` is what keeps `-not` from claiming the front of `-notlike`
 * and lets `-Force` fall through to the parameter rule instead of matching the
 * `-f` format operator.
 */
const WORD_OPERATOR =
  '-[ci]?(?:eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|replace|split|join|isnot|is|as|and|or|xor|not|band|bor|bxor|bnot|shl|shr|f)\\b'

/** Type accelerators worth their own color; anything else in `[...]` is a user type. */
const BUILTIN_TYPE =
  'string|char|byte|int|int32|int64|long|bool|boolean|double|float|decimal|object|array|hashtable|pscustomobject|psobject|scriptblock|switch|datetime|regex|xml|void|version'

/**
 * The inside of `[...]`: a possibly dotted name, optionally followed by one
 * bracketed suffix so `[string[]]` and `[List[string]]` read as one type. The
 * suffix excludes both brackets, so a line of `[` cannot make it rescan.
 * Deeper nesting (`[List[List[int]]]`) falls back to plain brackets.
 */
const TYPE_NAME = `${ID}[\\w.]*(?:\\[[^\\][\\n]*\\])?`

const powershell: Grammar = {
  name: 'powershell',
  aliases: ['ps', 'ps1', 'pwsh', 'posh'],
  states: {
    root: {
      ignoreCase: true,
      rules: [
        // ---- comments ------------------------------------------------------
        { match: '<#', scope: 'comment', push: 'block-comment' },
        // `#` only opens a comment at the start of a token, so `$a#b` and a
        // bare path containing a `#` stay code.
        // The separator is asserted, not consumed — consuming it scoped the
        // `;` of `$a = 1;# note` and the `(` of `foo(#x` as comment text.
        { match: '(?<=^|[ \\t;(])#[^\\n]*', scope: 'comment' },

        // ---- strings -------------------------------------------------------
        // A here-string opener has to be the last thing on its line, which is
        // what tells `@"` apart from `@` followed by an ordinary string.
        {
          match: '@"[ \\t]*\\r?$',
          scope: 'string.special',
          push: 'heredoc-double',
        },
        {
          match: "@'[ \\t]*\\r?$",
          scope: 'string.special',
          push: 'heredoc-single',
        },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        // Outside a string a backtick still escapes the next character — most
        // often a newline, as a line continuation.
        { match: '`[\\s\\S]', scope: 'string.escape' },

        // ---- variables and subexpressions ----------------------------------
        // `$(` and `@(` open a real expression: push so the matching `)` cannot
        // be mistaken for the end of a `param(` list further out.
        { match: '[$@]\\(', scope: 'punctuation.bracket', push: 'paren' },
        { match: '@\\{', scope: 'punctuation.bracket' },
        { include: 'variables' },
        // Splatting: `@config` passes a hashtable as parameters.
        { match: `@${ID}`, scope: 'variable' },

        // ---- attributes and type literals ----------------------------------
        // `[Parameter(...)]` is an attribute, `[string]` is a type. The only
        // difference a regex can see is the `(`.
        {
          match: `(\\[)(${ID}[\\w.]*)(?=\\()`,
          scope: ['punctuation.bracket', 'decorator'],
        },
        {
          match: `(\\[)((?:${BUILTIN_TYPE})(?:\\[[^\\][\\n]*\\])?)(\\])`,
          scope: ['punctuation.bracket', 'type.builtin', 'punctuation.bracket'],
        },
        {
          match: `(\\[)(${TYPE_NAME})(\\])`,
          scope: ['punctuation.bracket', 'type', 'punctuation.bracket'],
        },

        // ---- member access -------------------------------------------------
        {
          match: `(::)(${ID})(?=[ \\t]*\\()`,
          scope: ['operator', 'function.method'],
        },
        { match: `(::)(${ID})`, scope: ['operator', 'variable.member'] },
        {
          match: `(\\.)(${ID})(?=\\()`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },

        // ---- declarations --------------------------------------------------
        // Command names may contain `-`, so the function name is `[\w-]*` where
        // a class or enum name is not.
        {
          match: '\\b(function|filter|workflow)([ \\t]+)([a-z_][\\w-]*)([ \\t]*)(\\()',
          scope: ['keyword.declaration', null, 'function', null, 'punctuation.bracket'],
          push: 'params',
        },
        {
          match: '\\b(function|filter|workflow)([ \\t]+)([a-z_][\\w-]*)',
          scope: ['keyword.declaration', null, 'function'],
        },
        {
          match: `\\b(class|enum)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        {
          match: '\\b(param)([ \\t]*)(\\()',
          scope: ['keyword.declaration', null, 'punctuation.bracket'],
          push: 'params',
        },
        {
          match: '\\b(using)([ \\t]+)(namespace|module|assembly)([ \\t]+)([\\w.]+)',
          scope: ['keyword.import', null, 'keyword.import', null, 'namespace'],
        },

        // ---- keywords ------------------------------------------------------
        {
          match:
            '\\b(?:if|elseif|else|switch|default|foreach|for|while|do|until|break|continue|return|throw|exit|try|catch|finally|trap)\\b',
          scope: 'keyword.control',
        },
        {
          match: '\\b(?:begin|process|end|clean|dynamicparam|param|hidden|static|data)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\busing\\b', scope: 'keyword.import' },
        { match: '\\bin\\b', scope: 'keyword.operator' },

        // ---- commands ------------------------------------------------------
        // `Verb-Noun` first, so `Import-Module` is one command rather than the
        // word `Import` followed by something that looks like a parameter. The
        // `\b` anchor matters: unanchored, this would rescan every word looking
        // for a `-` it will not find.
        { match: '\\b[a-z]\\w*-[a-z]\\w*\\b', scope: 'function.call' },

        { match: WORD_OPERATOR, scope: 'keyword.operator' },
        // A parameter starts a token: `$a-b` and `5-x` are arithmetic. This has
        // to be a lookbehind rather than a consumed separator, because the
        // merged regex picks the leftmost match before it picks the
        // higher-priority rule — eating the space would make `-eq` a parameter.
        { match: '(?<![\\w)\\]}\'"])-[a-z]\\w*', scope: 'variable.parameter' },
        { match: `\\b${ID}(?=\\()`, scope: 'function.call' },

        // ---- numbers -------------------------------------------------------
        {
          match: '\\b0x[0-9a-f]+(?:kb|mb|gb|tb|pb)?[ldu]?\\b',
          scope: 'number',
        },
        { match: '\\b0b[01]+[ldu]?\\b', scope: 'number' },
        {
          match: '\\b\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?(?:kb|mb|gb|tb|pb)?[ldu]?\\b',
          scope: 'number',
        },

        // ---- operators and punctuation -------------------------------------
        {
          match: '\\+\\+|--|\\.\\.|::|&&|\\|\\||\\?\\?=?|[-+*/%]=?|[!<>=]=?|[|&]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    /**
     * Variables that keep their meaning even where a `$name` is being declared,
     * so `param([switch]$Force = $true)` does not read `$true` as a parameter.
     */
    'special-variables': {
      ignoreCase: true,
      rules: [
        { match: '\\$(?:true|false)\\b', scope: 'boolean' },
        { match: '\\$null\\b', scope: 'constant.builtin' },
        {
          match:
            '\\$(?:_|this|args|input|matches|error|host|pwd|psitem|pscmdlet|psscriptroot|psboundparameters|psversiontable|lastexitcode|myinvocation|erroractionpreference)\\b',
          scope: 'variable.builtin',
        },
        // `$$`, `$?` and `$^` — the last token, status and first token.
        { match: '\\$[$?^]', scope: 'variable.builtin' },
        {
          match: `\\$((?:env|global|script|local|private|using|variable|function):)${ID}`,
          scope: ['namespace'],
          rest: 'variable',
        },
      ],
    },

    /**
     * Shared by code and by interpolating strings, which is why the automatic
     * and preference variables are recognised here rather than in `root`.
     */
    variables: {
      ignoreCase: true,
      rules: [
        { include: 'special-variables' },
        // `${any name}`. Both braces are excluded from the scan so a run of
        // `${` cannot cost a line rescan each.
        { match: '\\$\\{[^{}\\n]*\\}', scope: 'variable' },
        { match: `\\$${ID}`, scope: 'variable' },
      ],
    },

    /** Escapes and expansions shared by `"..."` and the `@"` here-string. */
    interpolated: {
      ignoreCase: true,
      rules: [
        { match: '`[\\s\\S]', scope: 'string.escape' },
        { match: '\\$\\(', scope: 'interpolation', push: 'subexpression' },
        { include: 'variables' },
      ],
    },

    'string-double': {
      default: 'string',
      ignoreCase: true,
      rules: [
        // `""` is the escaped quote; it has to beat the closing rule.
        { match: '""', scope: 'string.escape' },
        { include: 'interpolated' },
        { match: '"', scope: 'string', pop: true },
      ],
    },

    // Single quotes are literal: no backtick escapes, no expansion, and `''`
    // is the only way to get a quote in.
    'string-single': {
      default: 'string',
      rules: [
        { match: "''", scope: 'string.escape' },
        { match: "'", scope: 'string', pop: true },
      ],
    },

    // A here-string ends at its terminator on a line of its own. Leading
    // whitespace is tolerated because indented terminators are everywhere,
    // even though Windows PowerShell rejects them.
    'heredoc-double': {
      default: 'string',
      ignoreCase: true,
      rules: [{ match: '^[ \\t]*"@', scope: 'string.special', pop: true }, { include: 'interpolated' }],
    },
    'heredoc-single': {
      default: 'string',
      rules: [{ match: "^[ \\t]*'@", scope: 'string.special', pop: true }],
    },

    /** The body of `$( ... )` inside a string: ordinary code that ends at `)`. */
    subexpression: {
      ignoreCase: true,
      rules: [
        { match: '\\)', scope: 'interpolation', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { include: 'root' },
      ],
    },

    /** Balanced parentheses, so an inner `)` never ends an outer construct. */
    paren: {
      ignoreCase: true,
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { include: 'root' },
      ],
    },

    /**
     * A `param(...)` or `function name(...)` list, where a `$name` is being
     * declared rather than used. `special-variables` comes first so a default
     * value of `$true` or `$env:HOME` keeps the meaning it has everywhere else.
     */
    params: {
      ignoreCase: true,
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { include: 'special-variables' },
        { match: `\\$${ID}`, scope: 'variable.parameter' },
        { include: 'root' },
      ],
    },

    'block-comment': {
      default: 'comment',
      ignoreCase: true,
      rules: [
        { match: '#>', pop: true },
        // Comment-based help: `.SYNOPSIS`, `.PARAMETER Name` and friends are
        // the reason most block comments exist, so they read as documentation.
        { match: '^([ \\t]*)(\\.[a-z]+)\\b', scope: [null, 'comment.doc'] },
      ],
    },
  },
}

export default powershell
