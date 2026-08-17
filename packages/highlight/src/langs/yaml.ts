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
