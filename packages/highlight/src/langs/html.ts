import type { Grammar } from '../core/types'

/**
 * HTML, XML and SVG.
 *
 * Attribute names, attribute values and the tag name each get their own scope,
 * and character entities are pulled out of the text so `&amp;` reads as markup
 * rather than as content.
 *
 * `<script>` and `<style>` bodies are highlighted as JavaScript and CSS when
 * those grammars are registered, and left unstyled otherwise — the HTML
 * grammar never imports them, so it does not cost their weight.
 */

const ENTITY = { match: '&(?:#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);', scope: 'string.escape' }

const html: Grammar = {
  name: 'html',
  aliases: ['xml', 'svg', 'vue'],
  states: {
    root: {
      ignoreCase: true,
      rules: [
        // States rather than lazy `[\\s\\S]*?` scans: those run to EOF and
        // fail once per opener, which is O(n²) on unterminated `<!--` runs.
        { match: '<!--', scope: 'comment', push: 'comment' },
        { match: '<!\\[CDATA\\[', scope: 'string', push: 'cdata' },
        {
          match: '(<!)(DOCTYPE)([^>]*)(>)',
          scope: ['punctuation.bracket', 'keyword', null, 'punctuation.bracket'],
        },
        // `<?xml version="1.0"?>` and other processing instructions are
        // metadata about the document, not commentary on it.
        { match: '<\\?', scope: 'decorator', push: 'processing-instruction' },

        { match: '(<)(script)(?=[\\s/>])', scope: ['punctuation.bracket', 'tag'], push: 'script-tag' },
        { match: '(<)(style)(?=[\\s/>])', scope: ['punctuation.bracket', 'tag'], push: 'style-tag' },
        {
          match: '(</?)([A-Za-z_][\\w:.-]*)',
          scope: ['punctuation.bracket', 'tag'],
          push: 'tag',
        },

        ENTITY,
      ],
    },

    comment: {
      default: 'comment',
      rules: [{ match: '-->', scope: 'comment', pop: true }],
    },
    cdata: {
      default: 'string',
      rules: [{ match: '\\]\\]>', scope: 'string', pop: true }],
    },
    'processing-instruction': {
      default: 'decorator',
      rules: [{ match: '\\?>', scope: 'decorator', pop: true }],
    },

    tag: {
      ignoreCase: true,
      rules: [{ match: '/?>', scope: 'punctuation.bracket', pop: true }, { include: 'attributes' }],
    },
    // The opening tag of an element whose body is another language. `>` hands
    // over to the body; a self-closing tag has none.
    'script-tag': {
      ignoreCase: true,
      rules: [
        { match: '/>', scope: 'punctuation.bracket', pop: true },
        { match: '>', scope: 'punctuation.bracket', set: 'script-body' },
        { include: 'attributes' },
      ],
    },
    'style-tag': {
      ignoreCase: true,
      rules: [
        { match: '/>', scope: 'punctuation.bracket', pop: true },
        { match: '>', scope: 'punctuation.bracket', set: 'style-body' },
        { include: 'attributes' },
      ],
    },
    'script-body': {
      ignoreCase: true,
      embed: { language: 'javascript', until: '</script(?=[\\s/>])' },
      rules: [],
    },
    'style-body': {
      ignoreCase: true,
      embed: { language: 'css', until: '</style(?=[\\s/>])' },
      rules: [],
    },

    attributes: {
      ignoreCase: true,
      rules: [
        // An unquoted value, before the attribute-name rule: `type=text` is a
        // name and a value, not two names.
        { match: '(=)([ \\t]*)([^\\s"\'=<>`]+)', scope: ['operator', null, 'string'] },
        // Framework-flavoured names (`:prop`, `@click`, `v-if`, `{...}`) are
        // common enough in templates to be worth matching as attributes.
        { match: '[@:#v-]?[A-Za-z_][\\w:.-]*', scope: 'tag.attribute' },
        { match: '=', scope: 'operator' },
        { match: '"', scope: 'string', push: 'attr-double' },
        { match: "'", scope: 'string', push: 'attr-single' },
        { match: '[^\\s>]+', scope: 'string' },
      ],
    },

    'attr-double': {
      default: 'string',
      rules: [ENTITY, { match: '"', scope: 'string', pop: true }],
    },
    'attr-single': {
      default: 'string',
      rules: [ENTITY, { match: "'", scope: 'string', pop: true }],
    },
  },
}

export default html
