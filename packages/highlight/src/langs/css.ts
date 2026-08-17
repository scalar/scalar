import type { Grammar } from '../core/types'

/**
 * CSS, SCSS and Less.
 *
 * Selectors, property names and values are separated by state rather than by
 * pattern guessing: entering `{` switches to a declaration state, so `color`
 * as a property and `color` inside a selector cannot be confused.
 */
const IDENT = '-{0,2}[A-Za-z_\\u0080-\\uFFFF][\\w-\\u0080-\\uFFFF]*'

const css: Grammar = {
  name: 'css',
  aliases: ['scss', 'less'],
  states: {
    root: {
      rules: [
        { include: 'comments' },
        { include: 'strings' },

        { match: '@[A-Za-z-]+', scope: 'keyword' },
        { match: `\\$${IDENT}`, scope: 'variable' },
        { match: '\\{', scope: 'punctuation.bracket', push: 'declarations' },

        // Selector pieces.
        { match: `[.#]${IDENT}`, scope: 'selector' },
        { match: '::?[A-Za-z-]+', scope: 'selector' },
        // `[` is excluded as well as `]`: an attribute selector cannot contain a
        // bare `[`, and allowing one makes a line of brackets cost O(n) each.
        { match: '\\[[^[\\]]*\\]', scope: 'selector' },
        { match: '\\b[a-z][\\w-]*\\b(?![\\w-]*\\s*:)', scope: 'tag' },
        { match: '[>~+*,]', scope: 'operator' },
        { match: '[{}();]', scope: 'punctuation' },
      ],
    },

    declarations: {
      rules: [
        { include: 'comments' },
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        // A nested rule (SCSS, or a media query body) gets its own scope.
        { match: '\\{', scope: 'punctuation.bracket', push: 'declarations' },
        { match: ';', scope: 'punctuation.delimiter' },
        { match: '@[A-Za-z-]+', scope: 'keyword' },
        {
          match: `(${IDENT})(\\s*)(:)`,
          scope: ['property', null, 'punctuation.delimiter'],
          push: 'value',
        },
        { match: `\\$${IDENT}`, scope: 'variable' },
        { match: `[.#&]${IDENT}`, scope: 'selector' },
        { match: '::?[A-Za-z-]+', scope: 'selector' },
        { include: 'strings' },
      ],
    },

    value: {
      rules: [
        { match: '(?=[;}])', pop: true },
        { include: 'comments' },
        { include: 'strings' },
        { match: '!important\\b', scope: 'keyword' },
        {
          match: '#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b',
          scope: 'number',
        },
        {
          match: 'var\\(\\s*(--[\\w-]+)',
          scope: ['variable'],
          rest: 'function.builtin',
        },
        { match: '--[\\w-]+', scope: 'variable' },
        { match: `\\b(${IDENT})(?=\\()`, scope: 'function.call' },
        {
          match: '(-?\\d*\\.?\\d+)((?:e[-+]?\\d+)?(?:%|[a-zA-Z]+)?)',
          scope: ['number', 'unit'],
        },
        { match: '\\b[a-zA-Z-]+\\b', scope: 'constant' },
        { match: '[(),/]', scope: 'punctuation' },
        { match: ';', scope: 'punctuation.delimiter', pop: true },
      ],
    },

    comments: {
      rules: [
        { match: '/\\*[\\s\\S]*?\\*/', scope: 'comment' },
        { match: '//[^\\n]*', scope: 'comment' },
      ],
    },

    strings: {
      rules: [
        { match: '"(?:[^"\\\\\\n]|\\\\.)*"', scope: 'string' },
        { match: "'(?:[^'\\\\\\n]|\\\\.)*'", scope: 'string' },
      ],
    },
  },
}

export default css
