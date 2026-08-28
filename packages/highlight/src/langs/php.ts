import type { Grammar } from '../core/types'

/**
 * PHP.
 *
 * The shape of the grammar follows the shape of the language: a PHP file is
 * markup until `<?php` opens a code region, so `root` is the HTML mode and the
 * code lives in a pushed state that `?>` pops. That is also what makes template
 * files work — `<a href="<?= $url ?>">` switches modes twice inside one tag.
 *
 * Things worth knowing about:
 *
 * - Heredocs and nowdocs cannot match their own terminator (that needs a
 *   backreference, which the compiler rejects), so any identifier alone on a
 *   line closes them. See the `heredoc-end` note.
 * - `#` starts a comment but `#[` starts an attribute, so the attribute rule
 *   runs first and lets the argument list tokenize as ordinary PHP.
 * - A line comment stops at `?>`, because PHP itself leaves code mode there.
 * - Interpolation is real: `"{$order->total()}"` tokenizes as an expression,
 *   while the same text in single quotes stays one string.
 */

/** Identifier. PHP allows the high-byte range in names, same as Python. */
const ID = '[A-Za-z_\\u0080-\\uFFFF][\\w\\u0080-\\uFFFF]*'

/** A possibly-qualified name: `Invoice`, `App\Billing\Invoice`, `\RuntimeException`. */
const NAME = `\\\\?${ID}(?:\\\\${ID})*`

/** An HTML tag or attribute name, for the inline-markup mode. */
const TAG = '[A-Za-z_][\\w:.-]*'

const php: Grammar = {
  name: 'php',
  aliases: ['php3', 'php4', 'php5', 'php8'],
  states: {
    // ---- inline markup -----------------------------------------------------
    // Outside `<?php … ?>` a PHP file is HTML. It is scoped rather than
    // highlighted with the HTML grammar — cross-language embedding is not a
    // thing the engine does yet — so this covers tags, attributes and comments
    // and stops there.
    root: {
      ignoreCase: true,
      rules: [
        { match: '<\\?(?:php\\b|=)', scope: 'tag', push: 'php' },
        { match: '<!--', scope: 'comment', push: 'html-comment' },
        {
          match: `(</?)(${TAG})`,
          scope: ['punctuation.bracket', 'tag'],
          push: 'html-tag',
        },
      ],
    },

    /** Markup and PHP block comments. Neither form nests. */
    'html-comment': {
      default: 'comment',
      rules: [{ match: '-->', pop: true }],
    },

    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', pop: true }],
    },

    'doc-comment': {
      default: 'comment.doc',
      rules: [{ match: '\\*/', pop: true }],
    },

    'html-tag': {
      ignoreCase: true,
      rules: [
        { match: '/?>', scope: 'punctuation.bracket', pop: true },
        // `value="<?= $x ?>"` is everywhere in templates, so an open tag beats
        // the attribute rules below.
        { match: '<\\?(?:php\\b|=)', scope: 'tag', push: 'php' },
        // A quoted value stops at `<` so it can never swallow an embedded PHP
        // region; a value that holds one simply renders unscoped.
        { match: '"[^"<]*"|\'[^\'<]*\'', scope: 'string' },
        { match: `[@:#]?${TAG}`, scope: 'tag.attribute' },
        { match: '=', scope: 'operator' },
      ],
    },

    // ---- code --------------------------------------------------------------
    php: {
      rules: [{ match: '\\?>', scope: 'tag', pop: true }, { include: 'expression' }],
    },

    expression: {
      rules: [
        // Before the comment rules: `#[` opens an attribute, `#` a comment.
        // Only the `#[Name` head is claimed so the arguments keep tokenizing as
        // PHP, which is what makes `#[Route('/x', methods: ['GET'])]` read.
        { match: `(#\\[)(${NAME})`, scope: ['decorator', 'decorator'] },

        // States rather than a lazy `[\\s\\S]*?` scan: the lazy form runs to EOF
        // and fails once per opener, which is O(n²) on a file with an
        // unterminated `/*`.
        { match: '/\\*\\*(?![/*])', scope: 'comment.doc', push: 'doc-comment' },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },
        // A line comment ends at `?>` as well as at the newline, because that
        // is where PHP leaves code mode — and a comment that swallowed the `?>`
        // would take the rest of a template file with it.
        //
        // Written as an unrolled loop rather than the obvious
        // `(?:[^?\n]|\?(?!>))*`: both are linear, but alternating per character
        // inside the merged regex measured ~450x slower on a long comment,
        // because every character leaves a backtracking state behind. Here the
        // inner group can only start at a `?`, which the run before it cannot
        // consume, so there is nothing to backtrack through.
        { match: '(?://|#)[^?\\n]*(?:\\?(?!>)[^?\\n]*)*', scope: 'comment' },

        { include: 'strings' },
        { include: 'numbers' },

        // Matched at the arrow, so `$logger->count` never reads as the builtin.
        {
          match: `(\\?->|->)([ \\t]*)(${ID})(?=[ \\t]*\\()`,
          scope: ['operator', null, 'function.method'],
        },
        {
          match: `(\\?->|->)([ \\t]*)(${ID})`,
          scope: ['operator', null, 'variable.member'],
        },
        {
          match: `(::)([ \\t]*)(${ID})(?=[ \\t]*\\()`,
          scope: ['operator', null, 'function.method'],
        },

        // Consume the opening paren so parameters get their own state.
        {
          match: `(function)([ \\t]+)(&?)(${ID})([ \\t]*)(\\()`,
          scope: ['keyword.declaration', null, 'operator', 'function', null, 'punctuation.bracket'],
          push: 'params',
        },
        {
          match: '\\b(function|fn)([ \\t]*)(&?)(\\()',
          scope: ['keyword.declaration', null, 'operator', 'punctuation.bracket'],
          push: 'params',
        },
        {
          match: `\\b(class|interface|trait|enum)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        {
          match: `\\b(namespace|use)([ \\t]+)(${NAME})`,
          scope: ['keyword.import', null, 'namespace'],
        },

        {
          match:
            '\\b(?:if|else|elseif|while|do|for|foreach|switch|case|default|break|continue|return|goto|throw|try|catch|finally|yield|match|declare|end(?:if|while|for|foreach|switch|declare))\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:abstract|final|public|private|protected|static|readonly|const|var|global|function|fn|class|interface|trait|enum|extends|implements)\\b',
          scope: 'keyword.declaration',
        },
        {
          match: '\\b(?:namespace|use|require_once|require|include_once|include)\\b',
          scope: 'keyword.import',
        },
        {
          match: '\\b(?:new|clone|instanceof|insteadof|as|and|or|xor)\\b',
          scope: 'keyword.operator',
        },
        { match: '\\b(?:echo|print)\\b', scope: 'keyword' },

        // Only the lowercase spellings. `TRUE`/`NULL` are just as legal and land
        // on the SCREAMING_CASE rule below, which is not wrong — they are
        // constants — and saves carrying every casing of every literal.
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        // `__DIR__`, `__CLASS__` and friends. Magic *methods* (`__construct`)
        // have no trailing underscores, so they are not caught here.
        { match: '\\bnull\\b|\\b__[A-Z]+__\\b', scope: 'constant.builtin' },

        { match: '\\$this\\b', scope: 'variable.builtin' },
        {
          match: '\\$(?:GLOBALS|_(?:GET|POST|REQUEST|SERVER|SESSION|COOKIE|FILES|ENV))\\b',
          scope: 'variable.builtin',
        },
        // `$$name` is a variable variable — one name, so one token.
        { match: `\\$\\$?${ID}`, scope: 'variable' },

        {
          match:
            '\\b(?:array_(?:map|filter|merge|keys|values|slice|sum)|in_array|count|is_(?:array|string|int|null|numeric)|str_(?:replace|repeat|contains|pad)|strlen|strtolower|strtoupper|substr|strpos|trim|sprintf|printf|number_format|implode|explode|json_(?:encode|decode)|preg_(?:match|replace|split)|var_dump|usort|isset|unset|empty|list|compact|exit|die)\\b',
          scope: 'function.builtin',
        },
        {
          match: '\\b(?:int|float|string|bool|array|object|mixed|void|never|callable|iterable|resource|self|parent)\\b',
          scope: 'type.builtin',
        },

        // Before the name rules, so `App\Models\Invoice` reads as a path into a
        // type rather than as three types.
        { match: `\\b${ID}(?=\\\\)`, scope: 'namespace' },
        // SCREAMING_CASE is a constant and CapWords a type. Between them these
        // cover class names, enum cases and every `define()`d constant without
        // shipping a name list.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },
        // PHP function names are conventionally lowercase, so a CapWords name
        // before a paren stays a type — which is what `new Invoice(…)` wants.
        { match: '\\b[a-z_]\\w*(?=[ \\t]*\\()', scope: 'function.call' },

        {
          match:
            '\\*\\*=?|\\?\\?=?|\\?->|<=>|<<=?|>>=?|===?|!==?|<>|=>|->|::|&&|\\|\\||\\+\\+|--|[-+*/%.&|^!]=?|[<>]=?|=|[?~@]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        // The namespace separator is punctuation, not the escape it looks like.
        { match: '[,;:]|\\\\', scope: 'punctuation.delimiter' },
      ],
    },

    numbers: {
      rules: [
        { match: '\\b0[xX][0-9a-fA-F_]+\\b', scope: 'number' },
        { match: '\\b0[bB][01_]+\\b', scope: 'number' },
        { match: '\\b0[oO][0-7_]+\\b', scope: 'number' },
        // Legacy `0755` octal needs no rule of its own: it reads as a decimal
        // literal and renders identically.
        {
          match:
            '\\b\\d[\\d_]*\\.[\\d_]*(?:[eE][-+]?\\d+)?|\\.\\d[\\d_]*(?:[eE][-+]?\\d+)?|\\b\\d[\\d_]*(?:[eE][-+]?\\d+)?\\b',
          scope: 'number',
        },
      ],
    },

    // ---- strings -----------------------------------------------------------
    strings: {
      rules: [
        // Nowdoc before heredoc: they differ only by the quotes on the marker,
        // and only the heredoc interpolates.
        { match: `<<<[ \\t]*'${ID}'`, scope: 'string.special', push: 'nowdoc' },
        {
          match: `<<<[ \\t]*"?${ID}"?`,
          scope: 'string.special',
          push: 'heredoc',
        },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: '`', scope: 'string', push: 'shell' },
      ],
    },

    escapes: {
      rules: [
        {
          match: '\\\\(?:x[0-9a-fA-F]{1,2}|u\\{[0-9a-fA-F]+\\}|[0-7]{1,3}|[nrtvef\\\\$"`])',
          scope: 'string.escape',
        },
      ],
    },

    interpolation: {
      rules: [
        // `{$…}` is the complex form and takes full expression syntax. The
        // lookahead is what keeps a literal `{` in a string from opening one.
        { match: '\\{(?=\\$)', scope: 'interpolation', push: 'interp' },
        // `${name}` — deprecated in 8.2, still all over older code.
        { match: '\\$\\{[^}\\n]*\\}', scope: 'variable' },
        // The simple form reaches exactly one `->prop` or one `[key]`, which is
        // all PHP itself parses without braces. `[` is excluded from the
        // subscript so the scan stops at the next one instead of at the newline.
        {
          match: `\\$${ID}(?:->${ID}|\\[[^\\[\\]\\n]*\\])?`,
          scope: 'variable',
        },
      ],
    },

    /**
     * Inside `{$…}`. A `{` here is left as punctuation rather than tracked,
     * because the complex form holds a variable expression and PHP has no
     * brace-shaped literal to nest inside one.
     */
    interp: {
      rules: [{ match: '\\}', scope: 'interpolation', pop: true }, { include: 'expression' }],
    },

    // A PHP string is allowed to span lines, so an unterminated one really does
    // run to the end of the file — no `$` escape hatch here, unlike Python.
    'string-double': {
      default: 'string',
      rules: [{ include: 'escapes' }, { include: 'interpolation' }, { match: '"', scope: 'string', pop: true }],
    },
    'string-single': {
      default: 'string',
      rules: [
        // Single quotes recognise exactly two escapes, and `\n` is not one.
        { match: "\\\\['\\\\]", scope: 'string.escape' },
        { match: "'", scope: 'string', pop: true },
      ],
    },
    /** Backtick shell execution. Interpolates, exactly like a double quote. */
    shell: {
      default: 'string',
      rules: [{ include: 'escapes' }, { include: 'interpolation' }, { match: '`', scope: 'string', pop: true }],
    },

    /**
     * The closing marker of a heredoc or a nowdoc.
     *
     * It cannot be matched against the opening one — that is a backreference,
     * and group numbers shift when rules merge — so any identifier alone on a
     * line, optionally trailed by the punctuation a heredoc can end with
     * (`;`, `,`, `)`, `]`), closes the body. A body line that is a single bare
     * word therefore ends it early. That is rare in the SQL, HTML and shell
     * text heredocs actually carry, and the alternative is not closing at all.
     */
    'heredoc-end': {
      rules: [
        // The indent stays string-coloured, so only the marker itself stands
        // out — PHP 7.3 lets the closing marker be indented with the body.
        {
          match: '^([ \\t]*)([A-Za-z_]\\w*)(?=[ \\t]*[;,)\\]]*[ \\t]*$)',
          scope: [null, 'string.special'],
          pop: true,
        },
      ],
    },

    heredoc: {
      default: 'string',
      rules: [{ include: 'heredoc-end' }, { include: 'escapes' }, { include: 'interpolation' }],
    },
    nowdoc: {
      default: 'string',
      rules: [{ include: 'heredoc-end' }],
    },

    // ---- parameters --------------------------------------------------------
    /**
     * A parameter list. Names are parameters rather than plain variables here,
     * which also covers constructor property promotion (`private int $qty`).
     */
    params: {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { match: `\\$${ID}`, scope: 'variable.parameter' },
        { include: 'expression' },
      ],
    },

    /** Balanced parens, so a call inside a default value cannot end the list. */
    paren: {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { include: 'expression' },
      ],
    },
  },
}

export default php
