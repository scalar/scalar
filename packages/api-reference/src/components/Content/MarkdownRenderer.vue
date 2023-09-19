<script setup lang="ts">
import rehypeDocument from 'rehype-document'
import rehypeFormat from 'rehype-format'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
// import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkTextr from 'remark-textr'
import typographicBase from 'typographic-base'
import { unified } from 'unified'
import { ref, watch } from 'vue'

const props = defineProps<{ value: string }>()

const html = ref<string>('')

watch(
  () => props.value,
  () => {
    unified()
      .use(remarkParse)
      // todo: investigate why these breaks get added to all paragraphs
      // .use(remarkBreaks)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(remarkTextr, { plugins: [typographicBase] })
      .use(rehypeDocument)
      .use(rehypeFormat)
      .use(rehypeSanitize, {
        ...defaultSchema,
        tagNames: defaultSchema.tagNames?.filter(
          (tag) => !['img'].includes(tag),
        ),
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
.markdown :deep(*) {
  margin-top: 12px;
}
.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3),
.markdown :deep(h4),
.markdown :deep(h5),
.markdown :deep(h6) {
  font-size: var(--font-size);
  margin: 12px 0 6px;
  font-weight: var(--theme-bold);
}

.markdown :deep(p) {
  font-size: var(--font-size, var(--theme-paragraph));
  /* prettier-ignore */
  color: var(--theme-color-1);
  font-weight: var(--font-weight, var(--theme-small));
  line-height: 1.5;
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

.markdown :deep(code) {
  font-family: var(--theme-font-code);
  background-color: var(--theme-background-2);
  box-shadow: 0 0 0 1px var(--theme-border-color);
  font-size: var(--theme-micro);
  border-radius: 2px;
  padding: 0 3px;
}

.markdown :deep(pre code) {
  display: block;
  white-space: pre;
  padding: 3px;
  margin: 12px 0;
  -webkit-overflow-scrolling: touch;
  overflow-x: scroll;
  max-width: 100%;
  min-width: 100px;
}

.markdown :deep(blockquote) {
  border-left: 3px solid var(--theme-border-color);
  padding-left: 12px;
}

.markdown :deep(table) {
  position: relative;
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 1em 0;
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--theme-border-color);
  border-radius: var(--theme-radius-lg);
}

.markdown :deep(td),
.markdown :deep(th) {
  min-width: 1em;
  padding: 6px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
  word-break: break-all;
  border-right: 1px solid var(--theme-border-color);
  border-bottom: 1px solid var(--theme-border-color);
}

.markdown :deep(td > *),
.markdown :deep(th > *) {
  margin-bottom: 0;
}
.markdown.parameter-description :deep(p) {
  margin-top: 4px;
  font-size: var(--theme-small);
  color: var(--theme-color-2);
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
  background: var(--theme-background-2);
}
</style>
