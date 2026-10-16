import type { Grammar, State } from '../core/types'

/**
 * Markdown.
 *
 * Prose is left alone; only the marks are styled. A fenced code block that
 * names a registered language is highlighted with that language; any other
 * fence becomes a literal state, so its contents are never mistaken for
 * Markdown syntax.
 */
/**
 * The states between a language fence and its closing fence: `<name>-code`
 * scopes the closing fence and `<name>-body` hands the body to the language.
 * `close` is a run of the opening character, which CommonMark lets be longer
 * than the opener.
 */
const codeFence = (name: string, close: string): Record<string, State> => {
  const closing = `^[ \\t]*${close}[ \\t]*$`
  return {
    [`${name}-code`]: {
      default: 'string',
      rules: [
        { match: closing, scope: 'punctuation', pop: true },
        { match: '^', push: `${name}-body` },
      ],
    },
    [`${name}-body`]: {
      default: 'string',
      embed: { language: '{{remembered}}', until: closing },
      rules: [],
    },
  }
}

const markdown: Grammar = {
  name: 'markdown',
  aliases: ['md', 'mdx'],
  states: {
    root: {
      rules: [
        // A three-character fence that names a language hands its body to that
        // language. Longer fences keep the literal form below, so a ```` block
        // that shows ``` inside still closes only on its own run.
        // The two fence characters get a state each, because only a run of the
        // character that opened the block closes it.
        {
          match: '^([ \\t]*)(```(?!`))([ \\t]*)([A-Za-z][\\w+#.-]*)([^\\n]*)$',
          scope: [null, 'punctuation', null, 'type', 'type'],
          push: 'backtick-code',
          remember: 4,
        },
        {
          match: '^([ \\t]*)(~~~(?!~))([ \\t]*)([A-Za-z][\\w+#.-]*)([^\\n]*)$',
          scope: [null, 'punctuation', null, 'type', 'type'],
          push: 'tilde-code',
          remember: 4,
        },
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
    ...codeFence('backtick', '`{3,}'),
    ...codeFence('tilde', '~{3,}'),
    'html-comment': {
      default: 'comment',
      rules: [{ match: '-->', scope: 'comment', pop: true }],
    },
  },
}

export default markdown
