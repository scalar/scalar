import type { Grammar } from '../core/types'

/**
 * HTML, XML and SVG.
 *
 * Attribute names, attribute values and the tag name each get their own scope,
 * and character entities are pulled out of the text so `&amp;` reads as markup
 * rather than as content.
 *
 * `<script>` and `<style>` bodies are left unstyled: highlighting them means
 * running another grammar, which is a follow-up (see README).
 */
const html: Grammar = {
  name: 'html',
  aliases: ['xml', 'svg', 'vue'],
  states: {
    root: {
      ignoreCase: true,
      rules: [
        { match: '<!--[\\s\\S]*?-->', scope: 'comment' },
        { match: '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', scope: 'string' },
        {
          match: '(<!)(DOCTYPE)([^>]*)(>)',
          scope: ['punctuation.bracket', 'keyword', null, 'punctuation.bracket'],
        },
        { match: '<\\?[\\s\\S]*?\\?>', scope: 'comment' },

        {
          match: '(</?)([A-Za-z_][\\w:.-]*)',
          scope: ['punctuation.bracket', 'tag'],
          push: 'tag',
        },

        {
          match: '&(?:#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);',
          scope: 'string.escape',
        },
      ],
    },

    tag: {
      ignoreCase: true,
      rules: [
        { match: '/?>', scope: 'punctuation.bracket', pop: true },
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
      rules: [
        {
          match: '&(?:#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);',
          scope: 'string.escape',
        },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    'attr-single': {
      default: 'string',
      rules: [
        {
          match: '&(?:#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);',
          scope: 'string.escape',
        },
        { match: "'", scope: 'string', pop: true },
      ],
    },
  },
}

export default html
