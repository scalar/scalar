<script setup lang="ts">
import rehypeExternalLinks from 'rehype-external-links'
import rehypeFormat from 'rehype-format'
import rehypePrism from 'rehype-prism'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { onServerPrefetch, ref, watch } from 'vue'

import { sleep } from '../../helpers'

const props = withDefaults(
  defineProps<{
    value?: string
    withImages?: boolean
  }>(),
  {
    withImages: false,
  },
)

const html = ref<string>('')

const disallowedTagNames = props.withImages ? [] : ['img', 'picture']

watch(
  () => props.value,
  async () => {
    // Markdown pipeline
    const result = await unified()
      // Parses markdown
      .use(remarkParse)
      // Support autolink literals, footnotes, strikethrough, tables and tasklists
      .use(remarkGfm)
      // Allows any HTML tags
      .use(remarkRehype, { allowDangerousHtml: true })
      // Creates a HTML AST
      .use(rehypeRaw)
      // Removes disallowed tags
      .use(rehypeSanitize, {
        ...defaultSchema,
        // Makes it even more strict
        tagNames: defaultSchema.tagNames?.filter(
          (tag) => !disallowedTagNames.includes(tag),
        ),
      })
      // Syntax highlighting
      .use(rehypePrism)
      // Adds target="_blank" to external links
      .use(rehypeExternalLinks, { target: '_blank' })
      // Formats the HTML
      .use(rehypeFormat)
      // Converts the HTML AST to a string
      .use(rehypeStringify)
      // Run the pipeline
      .process(props.value)

    // Puts it into the DOM
    html.value = String(result.value)
  },
  { immediate: true },
)

// SSR hack - waits for the watch to complete
onServerPrefetch(async () => await sleep(1))
</script>

<template>
  <div
    class="markdown"
    v-html="html" />
</template>

<style scoped>
.markdown {
  color: var(--scalar-color-1);
  all: unset;
  word-break: break-word;
}
/* all elements inside .markdown */
.markdown :deep(*) {
  all: unset;
  margin: 12px 0;
  font-family: var(--scalar-font);
  color: var(--scalar-color-1);
}
.markdown :deep(details) {
  margin: 12px 0;
  color: var(--scalar-color-1);
}
.markdown :deep(summary) {
  margin: 12px 0;
  padding-left: 20px;
  position: relative;
  font-weight: var(--scalar-semibold);
  cursor: pointer;
  user-select: none;
}

.markdown :deep(summary::after) {
  display: block;
  content: '';

  position: absolute;
  top: 1px;
  left: 1px;

  width: 16px;
  height: 16px;

  background-color: var(--scalar-color-3);
  mask-image: url('data:image/svg+xml,<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.25 19.5L15.75 12L8.25 4.5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
}

.markdown :deep(summary:hover::after) {
  background-color: var(--scalar-color-1);
}

.markdown :deep(details[open] summary::after) {
  transform: rotate(90deg);
}

/* Fix for Safari displaying default caret next to `<summary>` */
.markdown :deep(summary::-webkit-details-marker) {
  display: none;
}

.markdown :deep(img) {
  overflow: hidden;
  border-radius: var(--scalar-radius);
  max-width: 100%;
}
/* Don't add margin to the first block */
.markdown :deep(> :first-child) {
  margin-top: 0;
}
.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3),
.markdown :deep(h4),
.markdown :deep(h5),
.markdown :deep(h6) {
  font-size: var(--font-size);
  margin: 18px 0 6px;
  font-weight: var(--scalar-bold);
  display: block;
  line-height: 1.45;
}
.markdown :deep(b),
.markdown :deep(strong) {
  font-weight: var(--scalar-bold);
}
.markdown :deep(p) {
  color: var(--scalar-color-1);
  font-weight: var(--font-weight, var(--scalar-regular));
  line-height: 1.5;
  margin-bottom: 0;
  display: block;
}

.markdown :deep(ul),
.markdown :deep(ol) {
  padding-left: 24px;
  line-height: 1.5;
  margin: 12px 0;
  display: block;
}

.markdown :deep(ul) {
  list-style: disc;
}

.markdown :deep(ol) {
  list-style: decimal;
}

.markdown :deep(ul.contains-task-list) {
  list-style: none;
  padding-left: 0;
}

.markdown :deep(li) {
  margin: 6px 0;
  display: list-item;
}
.markdown :deep(a) {
  color: var(--scalar-color-accent);
  text-decoration: var(--scalar-text-decoration);
  cursor: pointer;
}
.markdown :deep(a:hover) {
  text-decoration: var(--scalar-text-decoration-hover);
}
.markdown :deep(em) {
  font-style: italic;
}
.markdown :deep(sup) {
  font-size: var(--scalar-micro);
  vertical-align: super;
  font-weight: 450;
}
.markdown :deep(sub) {
  font-size: var(--scalar-micro);
  vertical-align: sub;
  font-weight: 450;
}
.markdown :deep(del) {
  text-decoration: line-through;
}
.markdown :deep(code) {
  font-family: var(--scalar-font-code);
  background-color: var(--scalar-background-2);
  box-shadow: 0 0 0 1px var(--scalar-border-color);
  font-size: var(--scalar-micro);
  border-radius: 2px;
  padding: 0 3px;
}

.markdown :deep(pre code) {
  display: block;
  white-space: pre;
  padding: 12px;
  line-height: 1.5;
  margin: 12px 0;
  -webkit-overflow-scrolling: touch;
  overflow-x: auto;
  max-width: 100%;
  min-width: 100px;
}

.markdown :deep(blockquote) {
  border-left: 3px solid var(--scalar-border-color);
  padding-left: 12px;
  margin: 0;
  display: block;
}

.markdown :deep(table) {
  display: block;
  overflow-x: auto;
  position: relative;
  border-collapse: collapse;
  width: max-content;
  max-width: 100%;
  margin: 1em 0;
  box-shadow: 0 0 0 1px var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
}
.markdown :deep(tbody) {
  display: table-row-group;
  vertical-align: middle;
}
.markdown :deep(thead) {
  display: table-header-group;
  vertical-align: middle;
}

.markdown :deep(tr) {
  display: table-row;
  border-color: inherit;
  vertical-align: inherit;
}
.markdown :deep(td),
.markdown :deep(th) {
  display: table-cell;
  vertical-align: inherit;
  min-width: 1em;
  padding: 6px 9px;
  vertical-align: top;
  line-height: 1.5;
  position: relative;
  word-break: initial;
  font-size: var(--scalar-small);
  color: var(--scalar-color-1);
  font-weight: var(--font-weight, var(--scalar-regular));
  border-right: 1px solid var(--scalar-border-color);
  border-bottom: 1px solid var(--scalar-border-color);
}

.markdown :deep(td > *),
.markdown :deep(th > *) {
  margin-bottom: 0;
}
.markdown :deep(th:empty) {
  display: none;
}
.markdown :deep(td:first-of-type),
.markdown :deep(th:first-of-type) {
  border-left: none;
}

.markdown :deep(td:last-of-type),
.markdown :deep(th:last-of-type) {
  border-right: none;
}

.markdown :deep(tr:last-of-type td) {
  border-bottom: none;
}

.markdown :deep(th) {
  font-weight: var(--scalar-semibold) !important;
  text-align: left;
  border-left-color: transparent;
  background: var(--scalar-background-2);
}

.markdown :deep(tr) > [align='left'] {
  text-align: left;
}
.markdown :deep(tr) > [align='right'] {
  text-align: right;
}
.markdown :deep(tr) > [align='center'] {
  text-align: center;
}
</style>

<style lang="postcss">
.markdown {
  pre code[class*='language-'] {
    display: block;
    overflow-x: auto;
    padding: 12px;
  }
  pre * {
    font-size: var(--scalar-small) !important;
    font-family: var(--scalar-font-code) !important;
  }
  code[class*='language-'] {
    padding: 3px 5px;
  }
  pre[class*='language-']::-moz-selection,
  pre[class*='language-'] ::-moz-selection,
  code[class*='language-']::-moz-selection,
  code[class*='language-'] ::-moz-selection {
    background: var(--scalar-background-3);
  }

  pre[class*='language-']::selection,
  pre[class*='language-'] ::selection,
  code[class*='language-']::selection,
  code[class*='language-'] ::selection {
    background: var(--scalar-background-3);
  }

  /* Code blocks */
  pre[class*='language-'] {
    padding: 1em;
    margin: 0.5em 0;
    overflow: auto;
    background-color: var(--scalar-background-4);
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: var(--scalar-color-2);
    font-style: italic;
  }

  .token.namespace {
    opacity: 0.7;
  }

  .token.string,
  .token.attr-value {
    color: var(--scalar-color-blue);
  }

  .token.punctuation,
  .token.operator {
    color: var(--scalar-color-1); /* no highlight */
  }

  .token.entity,
  .token.url,
  .token.symbol,
  .token.number,
  .token.boolean,
  .token.variable,
  .token.constant,
  .token.property,
  .token.regex,
  .token.inserted {
    color: var(--scalar-color-1);
  }

  .token.atrule,
  .token.keyword,
  .token.attr-name,
  .language-autohotkey .token.selector {
    color: var(--scalar-color-green);
  }

  .token.function,
  .token.deleted,
  .language-autohotkey .token.tag {
    color: var(--scalar-color-1);
  }

  .token.tag,
  .token.selector,
  .language-autohotkey .token.keyword {
    color: var(--scalar-color-blue);
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }

  .token.italic {
    font-style: italic;
  }
}
</style>
