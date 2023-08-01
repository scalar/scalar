<script setup lang="ts">
import rehypeDocument from 'rehype-document'
import rehypeFormat from 'rehype-format'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
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
.markdown {
  margin: 12px 0;
  color: var(--theme-color-1);
}

.markdown h1,
.markdown h2,
.markdown h3,
.markdown h4,
.markdown h5,
.markdown h6 {
  font-size: var(--font-size);
  margin: 12px 0 6px;
}

.markdown p {
  font-size: var(--font-size, var(--theme-paragraph));
  color: var(--font-color, var(--theme-color-1));
  font-weight: var(--font-weight, var(--theme-regular));
  line-height: 1.5;
}

.markdown ul,
.markdown ol {
  padding-left: 24px;
  line-height: 1.5;
  margin: 12px 0;
}

.markdown ul.contains-task-list {
  list-style: none;
  padding-left: 0;
}

.markdown li {
  margin: 6px 0;
}

.markdown code {
  font-family: var(--theme-font-code);
  background-color: var(--theme-background-2);
  box-shadow: 0 0 0 1px var(--theme-border-color);
  font-size: var(--theme-mini);
  border-radius: 2px;
  padding: 0 3px;
}

.markdown pre code {
  display: block;
  white-space: pre;
  padding: 3px;
  margin: 12px 0;
  -webkit-overflow-scrolling: touch;
  overflow-x: scroll;
  max-width: 100%;
  min-width: 100px;
}

.markdown blockquote {
  border-left: 3px solid var(--theme-border-color);
  padding-left: 12px;
}

.markdown table {
  position: relative;
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0;
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--theme-border-color);
  border-radius: var(--theme-radius);
}

.markdown td,
.markdown th {
  min-width: 1em;
  padding: 6px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
  word-break: break-all;
  border-right: var(--theme-border);
  border-bottom: var(--theme-border);
}

.markdown td > *,
.markdown th > * {
  margin-bottom: 0;
}

.markdown td:first-of-type,
.markdown th:first-of-type {
  border-left: none;
}

.markdown td:last-of-type,
.markdown th:last-of-type {
  border-right: none;
}

.markdown tr:last-of-type td {
  border-bottom: none;
}

.markdown th {
  font-weight: bold !important;
  text-align: left;
  border-left-color: transparent;
  background: var(--theme-background-2);
}
</style>
