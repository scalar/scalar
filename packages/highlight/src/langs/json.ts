import type { Grammar } from '../core/types'

/**
 * JSON, with JSONC comments and trailing-comma tolerance.
 *
 * Keys and string values get different scopes — the single change that does
 * the most for a config file's readability.
 */
const json: Grammar = {
  name: 'json',
  aliases: ['jsonc', 'json5'],
  states: {
    root: {
      rules: [
        { match: '//[^\\n]*', scope: 'comment' },
        // A state, not a lazy `[\\s\\S]*?` scan: that form runs to EOF and fails
        // once per opener, which is O(n²) on a run of unterminated `/*`.
        { match: '/\\*', scope: 'comment', push: 'block-comment' },

        // A string followed by `:` is a key, whatever nesting it sits in.
        {
          match: '("(?:[^"\\\\\\n]|\\\\.)*")(\\s*)(:)',
          scope: ['property', null, 'punctuation.delimiter'],
        },
        { match: '"', scope: 'string', push: 'string' },

        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnull\\b', scope: 'constant.builtin' },
        {
          match: '-?\\b\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?\\b',
          scope: 'number',
        },
        { match: '[{}\\[\\]]', scope: 'punctuation.bracket' },
        { match: '[,:]', scope: 'punctuation.delimiter' },
        // Anything else in a JSON document is a syntax error; showing it as
        // one beats rendering it as ordinary text.
        { match: '[^\\s{}\\[\\],:"]+', scope: 'invalid' },
      ],
    },
    string: {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u[0-9a-fA-F]{4}|["\\\\/bfnrt])',
          scope: 'string.escape',
        },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', scope: 'comment', pop: true }],
    },
  },
}

export default json
