import type { Grammar } from '../core/types'

/** Go. */
const go: Grammar = {
  name: 'go',
  aliases: ['golang'],
  states: {
    root: {
      rules: [
        { match: '//[^\\n]*', scope: 'comment' },
        { match: '/\\*[\\s\\S]*?\\*/', scope: 'comment' },

        { match: '`[^`]*`', scope: 'string' },
        { match: '"', scope: 'string', push: 'string' },
        {
          match: "'(?:[^'\\\\]|\\\\(?:u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.))'",
          scope: 'string',
        },

        {
          match:
            '\\b(?:if|else|for|range|switch|case|default|break|continue|return|goto|fallthrough|select|defer|go)\\b',
          scope: 'keyword.control',
        },
        // Ahead of the bare keyword list, which also matches `func` and
        // `package`. Rule order is priority order, so listing these after it
        // would mean the keyword always won and the name never got scoped.
        // The receiver is captured whole and left unscoped — its own name and
        // type are picked up by the rules further down.
        {
          match: '(func)(\\s+)(\\([^)\\n]*\\))?(\\s*)([A-Za-z_]\\w*)',
          scope: ['keyword.declaration', null, null, null, 'function'],
        },
        {
          match: '(package)(\\s+)([A-Za-z_]\\w*)',
          scope: ['keyword.declaration', null, 'namespace'],
        },
        {
          match: '\\b(?:func|var|const|type|struct|interface|map|chan|package)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\bimport\\b', scope: 'keyword.import' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\b(?:nil|iota)\\b', scope: 'constant.builtin' },
        {
          match:
            '\\b(?:append|cap|clear|close|complex|copy|delete|imag|len|make|max|min|new|panic|print|println|real|recover)\\b(?=\\s*\\()',
          scope: 'function.builtin',
        },
        {
          match:
            '\\b(?:bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr|any)\\b',
          scope: 'type.builtin',
        },

        {
          match: '(\\.)([A-Za-z_]\\w*)(?=\\s*\\()',
          scope: ['punctuation', 'function.method'],
        },
        {
          match: '(\\.)([A-Za-z_]\\w*)',
          scope: ['punctuation', 'variable.member'],
        },

        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },
        { match: '\\b[a-z_]\\w*(?=\\s*\\()', scope: 'function.call' },

        { match: '\\b0[xX][0-9a-fA-F_]+\\b', scope: 'number' },
        { match: '\\b0[bo][0-9_]+\\b', scope: 'number' },
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d+)?i?\\b',
          scope: 'number',
        },

        {
          match: ':=|\\.{3}|<-|&&|\\|\\||[-+*/%!&|^<>=]=?|\\+\\+|--',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },
    string: {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]{2}|[0-7]{3}|.)',
          scope: 'string.escape',
        },
        {
          match: '%[-+ #0]*(?:\\d+|\\*)?(?:\\.(?:\\d+|\\*))?[vTtbcdoOqxXUeEfFgGsp%]',
          scope: 'string.special',
        },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },
  },
}

export default go
