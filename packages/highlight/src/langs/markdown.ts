import type { Grammar } from '../core/types'

/**
 * Markdown.
 *
 * Prose is left alone; only the marks are styled. Fenced code blocks become a
 * literal state so their contents are never mistaken for Markdown syntax —
 * highlighting the fence body with its own language is a follow-up.
 */
const markdown: Grammar = {
  name: 'markdown',
  aliases: ['md', 'mdx'],
  states: {
    root: {
      rules: [
        // The fence remembers its run, so only a run of the same character at
        // least as long closes it: a ```` block can show ``` inside.
        {
          match: '^([ \\t]*)(```+|~~~+)([^\\n]*)$',
          scope: [null, 'punctuation', 'type'],
          push: 'fence',
          remember: 2,
        },
        { match: '<!--', scope: 'comment', push: 'html-comment' },

        { match: '^#{1,6}[ \\t][^\\n]*', scope: 'heading' },
        // `[^\\r\\n]`, so the `\\r` of a blank CRLF line does not count as text.
        { match: '^[^\\r\\n]+\\r?\\n(?:={2,}|-{2,})[ \\t]*$', scope: 'heading' },
        {
          match: '^[ \\t]*(?:\\*[ \\t]*){3,}$|^[ \\t]*(?:-[ \\t]*){3,}$|^[ \\t]*(?:_[ \\t]*){3,}$',
          scope: 'punctuation',
        },

        { match: '^[ \\t]*>[ \\t]?', scope: 'quote' },
        {
          match: '^([ \\t]*)([-*+]|\\d+[.)])(?=[ \\t])',
          scope: [null, 'list'],
        },

        { match: '`+[^`\\n]+`+', scope: 'string' },

        // The label excludes `[` as well as `]`. Allowing it would let a line
        // of `[` cost O(n) per bracket — the scan runs to the end of the line
        // and then fails for want of a `]` — which is quadratic on input a
        // docs pipeline does not control. Stopping at the next `[` also reads
        // an unbalanced `[a[b](c)` the way CommonMark does, as a link starting
        // at the inner bracket.
        {
          match: '(!?\\[)([^[\\]\\n]*)(\\])(\\()([^)\\n]*)(\\))',
          scope: ['punctuation', 'link', 'punctuation', 'punctuation', 'string', 'punctuation'],
        },
        {
          match: '(!?\\[)([^[\\]\\n]*)(\\])(\\[)([^[\\]\\n]*)(\\])',
          scope: ['punctuation', 'link', 'punctuation', 'punctuation', 'variable', 'punctuation'],
        },
        { match: '<https?://[^>\\n]+>', scope: 'link' },
        {
          match: '^(\\[)([^\\]\\n]+)(\\]:)([^\\n]*)',
          scope: ['punctuation', 'variable', 'punctuation', 'string'],
        },

        { match: '\\*\\*\\*[^*\\n]+\\*\\*\\*|___[^_\\n]+___', scope: 'strong' },
        { match: '\\*\\*[^*\\n]+\\*\\*|__[^_\\n]+__', scope: 'strong' },
        { match: '\\*[^*\\n]+\\*|(?:^|[\\s(])_[^_\\n]+_', scope: 'emphasis' },
        { match: '~~[^~\\n]+~~', scope: 'comment' },

        { match: '^([ \\t]*)(\\|)', scope: [null, 'punctuation'] },
        { match: '\\|', scope: 'punctuation' },

        // The attribute run stops at `<` too, so a line of unclosed `<a ` costs
        // O(n) per tag rather than a scan to the end of the line each.
        { match: '</?[A-Za-z][\\w:-]*(?:[ \\t][^<>\\n]*)?/?>', scope: 'tag' },
      ],
    },
    fence: {
      default: 'string',
      rules: [
        {
          match: '^[ \\t]*{{remembered}}[`~]*[ \\t]*$',
          scope: 'punctuation',
          pop: true,
        },
      ],
    },
    'html-comment': {
      default: 'comment',
      rules: [{ match: '-->', scope: 'comment', pop: true }],
    },
  },
}

export default markdown
