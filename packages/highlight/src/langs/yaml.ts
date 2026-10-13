import type { Grammar } from '../core/types'

/**
 * YAML.
 *
 * Keys are the load-bearing thing in a YAML file, so they are matched from the
 * line start and scoped separately from their values. Block scalars (`|`, `>`)
 * switch into a literal state so their contents are not re-parsed as YAML.
 *
 * A block scalar ends where the indentation does: at the first non-blank line
 * indented no further than its key. The key's indentation is remembered when
 * the block opens, so prose inside a `description: |` can say "Note: …"
 * without being read as a new key.
 */

/**
 * A mapping key, quoted or bare.
 *
 * The bare form is length-capped rather than open-ended. It is tried at every
 * column, and an uncapped lazy scan runs to the end of the line before failing
 * on a line with no `:`, which is quadratic in line length — a 20 KB
 * single-line value is seconds of blocking. No real key approaches the cap;
 * past it the text simply renders unscoped. A bare key cannot start with a
 * bracket, a comma or a quote: those are flow and string syntax.
 */
const KEY = `(?:"[^"\\n]*"|'[^'\\n]*'|[^\\s#:\\[\\]{},"'][^:\\n]{0,256}?)`

/** Inside `[…]` and `{…}`, where commas and brackets end a bare key. */
const FLOW_KEY = `(?:"[^"\\n]*"|'[^'\\n]*'|[^\\s#:,\\[\\]{}][^:,\\[\\]{}\\n]{0,256}?)`

/** A block scalar indicator with its optional chomping and indentation hints. */
const BLOCK = '[|>][-+1-9]{0,2}'

/** The rest of a line that opens a block scalar: blanks and an optional comment. */
const BLOCK_TAIL = '(?:([ \\t]+)(#[^\\n]*))?(?=[ \\t]*$)'

/** A comment starts at `#` only after whitespace, so `docs#section` stays one scalar. */
const COMMENT = { match: '(?<![^\\s])#[^\\n]*', scope: 'comment' }

const yaml: Grammar = {
  name: 'yaml',
  aliases: ['yml'],
  states: {
    root: {
      rules: [
        COMMENT,
        { match: '^(?:---|\\.\\.\\.)(?=[ \\t]|$)', scope: 'punctuation.delimiter' },

        // Block scalars, before the plain key rule. Each remembers the column
        // its content has to stay to the right of.
        //
        // `- key: |` — the column is the key's, not the dash's. The dash and
        // its indent share one scope: whitespace shows no color either way.
        {
          match: `^([ \\t]*-[ \\t]+)(${KEY})([ \\t]*)(:)([ \\t]+)(${BLOCK})${BLOCK_TAIL}`,
          scope: [
            'punctuation.delimiter',
            'property',
            null,
            'punctuation.delimiter',
            null,
            'operator',
            null,
            'comment',
          ],
          push: 'block-scalar',
          remember: 1,
          rememberAs: 'indent',
        },
        // `- |` — a list item that is itself a block scalar.
        {
          match: `^([ \\t]*)(-)([ \\t]+)(${BLOCK})${BLOCK_TAIL}`,
          scope: [null, 'punctuation.delimiter', null, 'operator', null, 'comment'],
          push: 'block-scalar',
          remember: 1,
          rememberAs: 'indent',
        },
        // `key: |`
        {
          match: `^([ \\t]*)(?!-[ \\t])(${KEY})([ \\t]*)(:)([ \\t]+)(${BLOCK})${BLOCK_TAIL}`,
          scope: [null, 'property', null, 'punctuation.delimiter', null, 'operator', null, 'comment'],
          push: 'block-scalar',
          remember: 1,
          rememberAs: 'indent',
        },

        {
          match: '^([ \\t]*)(-)(?=[ \\t]|$)',
          scope: [null, 'punctuation.delimiter'],
          push: 'value',
        },

        // `key:` — quoted or bare, optionally after a list dash.
        {
          match: `(${KEY})([ \\t]*)(:)(?=[ \\t]|$)`,
          scope: ['property', null, 'punctuation.delimiter'],
          push: 'value',
        },

        { match: '[&*][\\w-]+', scope: 'variable.special' },
        { match: '!!?[\\w/-]+', scope: 'type' },

        {
          match: `(${BLOCK})([ \\t]*)$`,
          scope: ['operator', null],
          push: 'block-scalar-loose',
        },

        { include: 'strings' },

        {
          match: '\\b(?:true|false|yes|no|on|off|True|False|Yes|No|On|Off)\\b',
          scope: 'boolean',
        },
        { match: '\\b(?:null|Null|NULL)\\b|~', scope: 'constant.builtin' },
        {
          match: '(?:^|[\\s,\\[{])(-?\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?)\\b',
          scope: ['number'],
        },

        { match: '[\\[{]', scope: 'punctuation.bracket', push: 'flow' },
        { match: '[\\]}]', scope: 'punctuation.bracket' },
        { match: ',', scope: 'punctuation.delimiter' },
      ],
    },

    /**
     * Everything to the right of a `key:` or a list `-`.
     *
     * A plain (unquoted) scalar is still a string, and in a real document —
     * an OpenAPI description, a CI workflow — it is most of the file. Scoping
     * it needs to know it sits in value position, which is what this state is
     * for: `on:` is a key, `on` after a colon is a string.
     *
     * The state lasts one line. `$` pops it, so a nested block on the next
     * line is read as keys again.
     */
    value: {
      rules: [
        COMMENT,

        {
          match: `(${BLOCK})([ \\t]*)$`,
          scope: ['operator', null],
          set: 'block-scalar-loose',
        },

        // `- uses: actions/checkout@v4` reaches here through the dash, so the
        // key form has to be recognised in value position too.
        {
          match: `(${KEY})([ \\t]*)(:)(?=[ \\t]|$)`,
          scope: ['property', null, 'punctuation.delimiter'],
        },

        { include: 'strings' },

        { match: '[&*][\\w-]+', scope: 'variable.special' },
        { match: '!!?[\\w/-]+', scope: 'type' },

        // Anchored to a value boundary so `no-cache` stays one plain scalar
        // rather than the boolean `no` followed by `-cache`.
        {
          match: '(?:true|false|yes|no|on|off|True|False|Yes|No|On|Off)(?=[ \\t]*(?:#|$))',
          scope: 'boolean',
        },
        {
          match: '(?:null|Null|NULL|~)(?=[ \\t]*(?:#|$))',
          scope: 'constant.builtin',
        },
        {
          match: '-?\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?(?=[ \\t]*(?:#|$))',
          scope: 'number',
        },

        { match: '[\\[{]', scope: 'punctuation.bracket', push: 'flow' },

        // The plain scalar itself: words separated by blanks, up to a comment
        // or the end of the line. Commas and `#` without a blank before them
        // are part of it in block context — `Hello, world` and
        // `https://x.dev/docs#auth` are one value each. Every repetition starts
        // at a blank, so the scan never backtracks into itself.
        { match: '[^\\s#\\[\\]{}][^\\s]*(?:[ \\t]+[^\\s#][^\\s]*)*', scope: 'string' },

        { match: '$', pop: true },
      ],
    },

    /**
     * A flow collection, `[…]` or `{…}`, which may span lines. Commas and
     * brackets delimit here, which they do not in a block value.
     */
    flow: {
      rules: [
        COMMENT,
        { match: '[\\[{]', scope: 'punctuation.bracket', push: 'flow' },
        { match: '[\\]}]', scope: 'punctuation.bracket', pop: true },
        { match: ',', scope: 'punctuation.delimiter' },
        {
          match: `(${FLOW_KEY})([ \\t]*)(:)(?=[ \\t]|$|[,\\]}])`,
          scope: ['property', null, 'punctuation.delimiter'],
        },
        { include: 'strings' },
        { match: '[&*][\\w-]+', scope: 'variable.special' },
        { match: '!!?[\\w/-]+', scope: 'type' },
        {
          match: '(?:true|false|yes|no|on|off|True|False|Yes|No|On|Off)(?=[ \\t]*(?:[,\\]}]|#|$))',
          scope: 'boolean',
        },
        {
          match: '(?:null|Null|NULL|~)(?=[ \\t]*(?:[,\\]}]|#|$))',
          scope: 'constant.builtin',
        },
        {
          match: '-?\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?(?=[ \\t]*(?:[,\\]}]|#|$))',
          scope: 'number',
        },
        { match: '[^\\s#,\\[\\]{}][^,\\[\\]{}\\n#]*', scope: 'string' },
      ],
    },

    // Quoted scalars are states rather than one pattern each: a pattern that
    // alternates escapes with other characters rescans to the end of the line
    // for every unterminated quote, which is O(n²) on a line of `\"`.
    strings: {
      rules: [
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
      ],
    },
    'string-double': {
      default: 'string',
      rules: [
        { match: '\\\\.', scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      rules: [
        { match: "''", scope: 'string.escape' },
        { match: "'", scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },

    /**
     * A block scalar whose key's column is remembered: it runs until the first
     * non-blank line that does not indent past that column.
     */
    'block-scalar': {
      default: 'string',
      rules: [{ match: '^(?!{{remembered}}[ \\t])(?=[ \\t]*\\S)', pop: true }],
    },

    /**
     * A block scalar opened somewhere its key's column is not known, such as
     * after a tag or an anchor. Approximated as "until a line that starts a new
     * key", which is what the content of a real document looks like.
     */
    'block-scalar-loose': {
      default: 'string',
      rules: [
        {
          match: '^(?=[ \\t]*(?:[^\\s#-][^:\\n]*:(?:[ \\t]|$)|-{3}|\\.{3}))',
          pop: true,
        },
      ],
    },
  },
}

export default yaml
