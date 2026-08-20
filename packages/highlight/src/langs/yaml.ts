import type { Grammar } from '../core/types'

/**
 * YAML.
 *
 * Keys are the load-bearing thing in a YAML file, so they are matched from the
 * line start and scoped separately from their values. Block scalars (`|`, `>`)
 * switch into a literal state so their contents are not re-parsed as YAML.
 */
const yaml: Grammar = {
  name: 'yaml',
  aliases: ['yml'],
  states: {
    root: {
      rules: [
        { match: '#[^\\n]*', scope: 'comment' },
        { match: '^(?:---|\\.\\.\\.)$', scope: 'punctuation.delimiter' },

        {
          match: '^([ \\t]*)(-)(?=[ \\t]|$)',
          scope: [null, 'punctuation.delimiter'],
          push: 'value',
        },

        // `key:` — quoted or bare, optionally after a list dash.
        //
        // The bare form is length-capped rather than open-ended. It is tried at
        // every column, and an uncapped lazy scan runs to the end of the line
        // before failing on a line with no `:`, which is quadratic in line
        // length — a 20 KB single-line value is seconds of blocking. No real
        // key approaches the cap; past it the text simply renders unscoped.
        {
          match: '((?:"[^"\\n]*"|\'[^\'\\n]*\'|[^\\s#:][^:\\n]{0,256}?))([ \\t]*)(:)(?=[ \\t]|$)',
          scope: ['property', null, 'punctuation.delimiter'],
          push: 'value',
        },

        { match: '[&*][\\w-]+', scope: 'variable.special' },
        { match: '!!?[\\w/-]+', scope: 'type' },

        {
          match: '([|>][-+]?)([ \\t]*)$',
          scope: ['operator', null],
          push: 'block-scalar',
        },

        { match: '"(?:[^"\\\\\\n]|\\\\.)*"', scope: 'string' },
        { match: "'(?:[^'\\n]|'')*'", scope: 'string' },

        {
          match: '\\b(?:true|false|yes|no|on|off|True|False|Yes|No|On|Off)\\b',
          scope: 'boolean',
        },
        { match: '\\b(?:null|Null|NULL)\\b|~', scope: 'constant.builtin' },
        {
          match: '(?:^|[\\s,\\[{])(-?\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?)\\b',
          scope: ['number'],
        },

        { match: '[\\[\\]{}]', scope: 'punctuation.bracket' },
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
        { match: '#[^\\n]*', scope: 'comment' },

        {
          match: '([|>][-+]?)([ \\t]*)$',
          scope: ['operator', null],
          set: 'block-scalar',
        },

        // `- uses: actions/checkout@v4` reaches here through the dash, so the
        // key form has to be recognised in value position too.
        {
          match: '((?:"[^"\\n]*"|\'[^\'\\n]*\'|[^\\s#:][^:\\n]{0,256}?))([ \\t]*)(:)(?=[ \\t]|$)',
          scope: ['property', null, 'punctuation.delimiter'],
        },

        { match: '"(?:[^"\\\\\\n]|\\\\.)*"', scope: 'string' },
        { match: "'(?:[^'\\n]|'')*'", scope: 'string' },

        { match: '[&*][\\w-]+', scope: 'variable.special' },
        { match: '!!?[\\w/-]+', scope: 'type' },

        // Anchored to a value boundary so `no-cache` stays one plain scalar
        // rather than the boolean `no` followed by `-cache`.
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

        { match: '[\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: ',', scope: 'punctuation.delimiter' },

        // The plain scalar itself. Greedy and unanchored on the right rather
        // than a capped lazy scan: a lazy `{0,n}?` here is retried at every
        // column and is what makes a long single-line value quadratic.
        { match: '[^\\s#,\\[\\]{}][^,\\[\\]{}\\n#]*', scope: 'string' },

        { match: '$', pop: true },
      ],
    },

    /**
     * A block scalar runs until a line indented no further than its
     * introducer. Approximated as "until a line that starts a new key", which
     * is what the content of a real document looks like.
     */
    'block-scalar': {
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
