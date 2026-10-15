import type { Grammar } from '../core/types'

/**
 * CSS, SCSS and Less.
 *
 * Selectors, property names and values are separated by state rather than by
 * pattern guessing: entering `{` switches to a declaration state, so `color`
 * as a property and `color` inside a selector cannot be confused.
 */
const IDENT = '-{0,2}[A-Za-z_\\u0080-\\uFFFF][\\w-\\u0080-\\uFFFF]*'

/** At-rules followed by a condition rather than by a selector or a name. */
const AT_CONDITION = '@(?:media|supports|container|import)\\b'

const css: Grammar = {
  name: 'css',
  aliases: ['scss', 'less'],
  states: {
    root: {
      rules: [
        { include: 'comments' },
        { include: 'strings' },

        { match: AT_CONDITION, scope: 'keyword', push: 'condition' },
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
        { match: AT_CONDITION, scope: 'keyword', push: 'condition' },
        { match: '@[A-Za-z-]+', scope: 'keyword' },
        {
          match: `(${IDENT})(\\s*)(:)`,
          scope: ['property', null, 'punctuation.delimiter'],
          push: 'value',
        },
        { match: `\\$${IDENT}`, scope: 'variable' },
        { match: `[.#&]${IDENT}`, scope: 'selector' },
        { match: '::?[A-Za-z-]+', scope: 'selector' },
        // A bareword with no `:` after it is incomplete, but consuming it keeps
        // the property rule above from being retried — and failing for want of a
        // colon — at every position of a long identifier run, which is O(n) each.
        { match: IDENT },
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
        // An unquoted `url(…)` is a string up to the `)`. Without its own state
        // the `//` in `url(https://…)` reads as an SCSS line comment and takes
        // the rest of the declaration with it.
        {
          match: '\\b(url)(\\()(?=[ \\t]*[^\\s"\'])',
          scope: ['function.builtin', 'punctuation'],
          push: 'url',
        },
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

    /**
     * The condition of `@media`, `@supports`, `@container` or `@import`, up to
     * the `{` or `;` that ends it: `screen and (min-width: 600px)`. Media
     * features read as properties and their values as values, and the words
     * between them as keywords.
     */
    condition: {
      rules: [
        { match: '(?=[{;}])', pop: true },
        { include: 'comments' },
        { include: 'strings' },
        { match: '\\b(?:and|or|not|only)\\b', scope: 'keyword' },
        {
          match: `(${IDENT})(\\s*)(:)`,
          scope: ['property', null, 'punctuation.delimiter'],
        },
        {
          match: '\\b(url)(\\()(?=[ \\t]*[^\\s"\'])',
          scope: ['function.builtin', 'punctuation'],
          push: 'url',
        },
        { match: `\\b(${IDENT})(?=\\()`, scope: 'function.call' },
        {
          match: '(-?\\d*\\.?\\d+)((?:e[-+]?\\d+)?(?:%|[a-zA-Z]+)?)',
          scope: ['number', 'unit'],
        },
        { match: `\\$${IDENT}`, scope: 'variable' },
        // A whole identifier, underscores included, so the feature rule above
        // is not retried — and failed for want of a colon — at every position
        // of a long name, which is O(n) each.
        { match: IDENT, scope: 'constant' },
        { match: '[(),/<>=]', scope: 'punctuation' },
      ],
    },

    url: {
      default: 'string',
      rules: [
        { match: '\\\\.', scope: 'string.escape' },
        { match: '\\)', scope: 'punctuation', pop: true },
        { match: '(?=[;}\\n])', pop: true },
      ],
    },

    comments: {
      rules: [
        // A state, not a lazy `[\\s\\S]*?` scan: that form runs to EOF and
        // fails once per opener, which is O(n²) on unterminated `/*` runs.
        { match: '/\\*', scope: 'comment', push: 'block-comment' },
        // SCSS and Less line comments. Not after a `:`, which is a URL scheme.
        { match: '(?<!:)//[^\\n]*', scope: 'comment' },
      ],
    },
    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', scope: 'comment', pop: true }],
    },

    // States rather than one pattern per literal: a pattern that alternates
    // escapes with other characters rescans to the end of the line for every
    // unterminated quote, which is O(n²) on a line of `\"`.
    strings: {
      rules: [
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
      ],
    },
    'string-double': {
      default: 'string',
      rules: [
        // A backslash before a line break continues the string; `\\r\\n` is one.
        { match: '\\\\(?:\\r\\n|[\\s\\S])', scope: 'string' },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      rules: [
        { match: '\\\\(?:\\r\\n|[\\s\\S])', scope: 'string' },
        { match: "'", scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },
  },
}

export default css
