<script setup lang="ts">
import rehypeExternalLinks from 'rehype-external-links'
import rehypeFormat from 'rehype-format'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { ref, watch } from 'vue'

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
    unified()
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
      .use(rehypeHighlight, {
        detect: true,
      })
      // Adds target="_blank" to external links
      .use(rehypeExternalLinks, { target: '_blank' })
      // Formats the HTML
      .use(rehypeFormat)
      // Converts the HTML AST to a string
      .use(rehypeStringify)
      // Run the pipeline
      .process(props.value)
      // Puts it into the DOM
      .then((result) => (html.value = String(result)))
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="markdown"
    v-html="html" />
</template>

<style scoped>
.markdown {
  color: var(--theme-color-1, var(--default-theme-color-1));
  all: unset;
  word-break: break-word;
}
/* all elements inside .markdown, but not <details> and <summary> */
.markdown :deep(*) {
  all: unset;
  margin: 12px 0;
  font-family: var(--theme-font, var(--default-theme-font));
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.markdown :deep(details) {
  margin: 12px 0;
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.markdown :deep(summary) {
  margin: 12px 0;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
.markdown :deep(img) {
  overflow: hidden;
  border-radius: var(--theme-radius, var(--default-theme-radius));
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
  font-size: var(--font-size, var(--default-font-size));
  margin: 18px 0 6px;
  font-weight: var(--theme-bold, var(--default-theme-bold));
  display: block;
  line-height: 1.45;
}
.markdown :deep(b),
.markdown :deep(strong) {
  font-weight: var(--theme-bold, var(--default-theme-bold));
}
.markdown :deep(p) {
  font-size: var(
    --font-size,
    var(--default-font-size),
    var(--theme-paragraph, var(--default-theme-paragraph))
  );
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(
    --font-weight,
    var(--default-font-weight),
    var(--theme-small, var(--default-theme-small))
  );
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
  color: var(
    --theme-color-accent,
    var(--default-theme-color-accent)
  ) !important;
  text-decoration: none !important;
  cursor: pointer;
}
.markdown :deep(a:hover) {
  text-decoration: underline !important;
}
.markdown :deep(em) {
  font-style: italic;
}
.markdown :deep(del) {
  text-decoration: line-through;
}
.markdown :deep(code) {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  background-color: var(
    --theme-background-2,
    var(--default-theme-background-2)
  );
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
  font-size: var(--theme-micro, var(--default-theme-micro));
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
  border-left: 3px solid
    var(--theme-border-color, var(--default-theme-border-color));
  padding-left: 12px;
  margin: 0;
  display: block;
}

.markdown :deep(table) {
  display: block;
  overflow-x: auto;
  position: relative;
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
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
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(
    --font-weight,
    var(--default-font-weight),
    var(--theme-small, var(--default-theme-small))
  );
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
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
  font-weight: var(--theme-semibold, var(--default-theme-semibold)) !important;
  text-align: left;
  border-left-color: transparent;
  background: var(--theme-background-2, var(--default-theme-background-2));
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
  pre code.hljs {
    display: block;
    overflow-x: auto;
    padding: 12px;
  }
  pre * {
    font-size: var(--theme-small, var(--default-theme-small)) !important;
    font-family: var(
      --theme-font-code,
      var(--default-theme-font-code)
    ) !important;
  }
  code.hljs {
    padding: 3px 5px;
  }
  .hljs {
    background: var(--theme-background-4, var(--default-theme-background-4));
    color: var(--theme-color-1, var(--default-theme-color-1));
  }
  .hljs-comment,
  .hljs-quote {
    color: var(--theme-color-3, var(--default-theme-color-3));
    font-style: italic;
  }
  .hljs-addition,
  .hljs-keyword,
  .hljs-literal,
  .hljs-selector-tag,
  .hljs-type {
    color: var(--theme-color-green, var(--default-theme-color-green));
  }
  .hljs-number,
  .hljs-selector-attr,
  .hljs-selector-pseudo {
    color: var(--theme-color-orange, var(--default-theme-color-orange));
  }
  .hljs-doctag,
  .hljs-regexp,
  .hljs-string {
    color: var(--theme-color-blue, var(--default-theme-color-blue));
  }
  .hljs-built_in,
  .hljs-name,
  .hljs-section,
  .hljs-title {
    color: var(--theme-color-1, var(--default-theme-color-1));
  }
  .hljs-class .hljs-title,
  .hljs-selector-id,
  .hljs-template-variable,
  .hljs-title.class_,
  .hljs-variable {
    color: var(--theme-color-1, var(--default-theme-color-1));
  }
  .hljs-name,
  .hljs-section,
  .hljs-strong {
    font-weight: var(--theme-semibold, var(--default-theme-semibold));
  }
  .hljs-bullet,
  .hljs-link,
  .hljs-meta,
  .hljs-subst,
  .hljs-symbol {
    color: var(--theme-color-blue, var(--default-theme-color-blue));
  }
  .hljs-deletion {
    color: var(--theme-color-red, var(--default-theme-color-red));
  }
  .hljs-formula {
    background: var(--theme-color-1, var(--default-theme-color-1));
  }
  .hljs-attr,
  .hljs-attribute {
    color: var(--theme-color-1, var(--default-theme-color-1));
  }
  .hljs-emphasis {
    font-style: italic;
  }
}
</style>
