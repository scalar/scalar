import type { Grammar, State } from '../core/types'

/** HTML blocks that end at their closing tag rather than at a blank line. */
const RAW_TAGS = 'script|pre|style|textarea'

/**
 * `RAW_TAGS` matched in any case, for the root state, which is case-sensitive
 * everywhere else. HTML tag names are not: `<SCRIPT>` opens the same block.
 */
const RAW_TAGS_ANY_CASE = RAW_TAGS.replace(/[a-z]/g, (c) => `[${c}${c.toUpperCase()}]`)

/**
 * Right after the `>` that ends a tag, and not one inside a quoted attribute
 * value: `<div title="a>b">` ends at the last `>`. Matched backwards from the
 * `>`, which is checked first, so every other position fails on one character.
 * The repeats are capped so a `>` on a long line costs a bounded scan.
 */
const AFTER_TAG = `(?<=<\\/?[A-Za-z][\\w-]{0,64}(?:[^<>"'\\n]|"[^"\\n]{0,512}"|'[^'\\n]{0,512}'){0,512}>)`

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

/**
 * Markdown.
 *
 * Prose is left alone; only the marks are styled. Three kinds of block belong
 * to other languages and are handed to them when they are registered:
 *
 * - a fenced code block that names its language
 * - YAML front matter
 * - HTML that starts a line, and `<script>`, `<pre>` and `<style>` blocks
 *
 * Any other fence becomes a literal state, so its contents are never mistaken
 * for Markdown syntax.
 */
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

        // Front matter: a `---` block at the very start, and only when it is
        // closed. An unclosed `---` on the first line is a thematic break, and
        // reading it as YAML would take the whole document with it. The
        // lookahead to the closing line runs once, at position 0.
        {
          match: '(?<![\\s\\S])---(?=[ \\t]*\\r?\\n[\\s\\S]*?^(?:---|\\.\\.\\.)[ \\t]*$)',
          scope: 'punctuation',
          push: 'front-matter',
        },

        // HTML at the start of a line goes to the HTML grammar. `<script>`,
        // `<pre>`, `<style>` and `<textarea>` run to the line that closes them,
        // as in CommonMark. Any other tag gets its line at most: CommonMark would
        // run the block to the next blank line, but MDX and most docs
        // renderers read Markdown inside components, and holding the lines
        // after `<Steps>` as HTML would strip their fences and emphasis.
        // Inline tags inside a paragraph keep the rule below.
        { match: `^(?=[ \\t]*<(?:${RAW_TAGS_ANY_CASE})(?:[\\s>]|$))`, push: 'html-raw' },
        { match: '^(?=[ \\t]*<\\/?[A-Za-z][\\w-]*(?:[\\s/>]|$))', push: 'html-line' },

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
    'front-matter': {
      rules: [
        { match: '^(?:---|\\.\\.\\.)[ \\t]*$', scope: 'punctuation', pop: true },
        { match: '^', push: 'front-matter-body' },
      ],
    },
    'front-matter-body': {
      embed: { language: 'yaml', until: '^(?:---|\\.\\.\\.)[ \\t]*$' },
      rules: [],
    },
    // Without the HTML grammar registered, HTML renders unscoped, the way a
    // fence in an unregistered language falls back to a plain string.
    'html-raw': {
      // The closing tag may be in any case, as the opening one may.
      ignoreCase: true,
      embed: {
        language: 'html',
        // The line break that ends the line holding the closing tag. The
        // lookahead goes first so the lookbehind only runs at line ends.
        until: `(?=\\n|(?![\\s\\S]))(?<=<\\/(?:${RAW_TAGS})[ \\t]*>[^\\n]*)`,
      },
      rules: [],
    },
    // To the end of the line, or to the first tag-ending `>` followed by text
    // rather than by another tag: in `<span>x</span> **y**` only the opening
    // tag is HTML, and the rest of the line stays Markdown for the inline rules.
    'html-line': {
      embed: { language: 'html', until: `$|${AFTER_TAG}(?![ \\t]*(?:<|$))` },
      rules: [],
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
