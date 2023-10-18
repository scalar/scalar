<script setup lang="ts">
import rehypeDocument from 'rehype-document'
import rehypeFormat from 'rehype-format'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkHeadingId from 'rehype-slug-custom-id'
import rehypeStringify from 'rehype-stringify'
// import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { ref, watch } from 'vue'

const props = defineProps<{ value?: string }>()

const html = ref<string>('')

watch(
  () => props.value,
  async () => {
    unified()
      .use(remarkParse)
      // todo: investigate why these breaks get added to all paragraphs
      // .use(remarkBreaks)
      .use(remarkGfm)
      .use(remarkRehype)
      // @ts-ignore
      .use(remarkHeadingId)
      .use(rehypeDocument)
      .use(rehypeFormat)
      .use(rehypeSanitize, {
        ...defaultSchema,
        tagNames: defaultSchema.tagNames?.filter(
          (tag) => !['img'].includes(tag),
        ),
      })
      .use(rehypeHighlight, {
        detect: true,
      })
      .use(rehypeStringify)
      .process(props.value)
      .then((result) => {
        html.value = String(result)
      })
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
  word-wrap: break-word;
}
.markdown :deep(*) {
  margin: 12px 0;
}
.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3),
.markdown :deep(h4),
.markdown :deep(h5),
.markdown :deep(h6) {
  font-size: var(--font-size, var(--default-font-size));
  margin: 24px 0 6px;
  font-weight: var(--theme-bold, var(--default-theme-bold));
}

.markdown :deep(p) {
  font-size: var(
    --font-size,
    var(--default-font-size),
    var(--theme-paragraph, var(--default-theme-paragraph))
  );
  /* prettier-ignore */
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(
    --font-weight,
    var(--default-font-weight),
    var(--theme-small, var(--default-theme-small))
  );
  line-height: 1.5;
  margin-bottom: 0;
}

.markdown :deep(ul),
.markdown :deep(ol) {
  padding-left: 24px;
  line-height: 1.5;
  margin: 12px 0;
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
}
.markdown :deep(a) {
  color: var(
    --theme-color-accent,
    var(--default-theme-color-accent)
  ) !important;
  text-decoration: none !important;
}
.markdown :deep(a:hover) {
  text-decoration: underline !important;
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
}

.markdown :deep(table) {
  position: relative;
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 1em 0;
  overflow: hidden;
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}

.markdown :deep(td),
.markdown :deep(th) {
  min-width: 1em;
  padding: 6px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
  word-break: break-all;
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.markdown :deep(td > *),
.markdown :deep(th > *) {
  margin-bottom: 0;
}
.markdown.parameter-description :deep(p) {
  margin-top: 4px;
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: 1.4;
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
  font-weight: bold !important;
  text-align: left;
  border-left-color: transparent;
  background: var(--theme-background-2, var(--default-theme-background-2));
}
</style>

<style lang="postcss">
.markdown {
  pre code.hljs {
    display: block;
    overflow-x: auto;
    padding: 1em;
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
