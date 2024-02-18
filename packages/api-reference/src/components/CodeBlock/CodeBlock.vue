<script lang="ts" setup>
import { highlightElement, plugins } from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/plugins/autoloader/prism-autoloader.js'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers.js'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

/**
 * Uses prism.js for syntax highlighting
 * New languages are loaded async
 *
 * For lazy loading we can use the raw methods to load it sync
 * const html = highlight(str, languages.javascript, 'javascript')
 * + line numbers plugin etc etc
 *
 * @link https://prismjs.com/
 */

const props = withDefaults(
  defineProps<{
    content: string | object
    lang?: string
    lineNumbers?: boolean
  }>(),
  {
    lang: 'js',
    lineNumbers: false,
  },
)

const el = ref(null)
const language = computed(() => {
  return props.lang === 'node' ? 'js' : props.lang
})

plugins.autoloader.languages_path =
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/'

watch(
  () => [props.lang, props.content],
  () => {
    if (el.value) nextTick(() => highlightElement(el.value!))
  },
)

onMounted(() => {
  if (el.value) highlightElement(el.value)
})
</script>
<template>
  <pre
    :class="{
      'line-numbers': lineNumbers,
    }"><code ref="el" :class="`lang-${language}`">{{content}}</code></pre>
</template>
<style>
code[class*='language-'],
pre[class*='language-'] {
  color: #ccc;
  background: none;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 1em;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  word-wrap: normal;
  line-height: 1.5;

  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;

  -webkit-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;
}

/* Code blocks */
pre[class*='language-'] {
  margin: 0;
  padding: 0.5rem;
  overflow: auto;
}

:not(pre) > code[class*='language-'],
pre[class*='language-'] {
  background: var(--theme-background-2, var(--default-theme-background-2));
}

/* Line Numbers */
pre[class*='language-'].line-numbers {
  padding-left: 2em;
}

.line-numbers span.line-numbers-rows {
  width: 2em;
  border: none;
  left: -2em;
  top: -3px;
}

/* Inline code */
:not(pre) > code[class*='language-'] {
  padding: 0.1em;
  border-radius: 0.3em;
  white-space: normal;
}

/* Code */
.token.comment,
.token.block-comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: #999;
}

.token.punctuation {
  color: #ccc;
}

.token.tag,
.token.attr-name,
.token.namespace,
.token.deleted {
  color: var(--theme-color-red, var(--default-theme-color-red));
}

.token.function-name {
  color: var(--theme-color-green, var(--default-theme-color-green));
}

.token.boolean,
.token.number,
.token.function {
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}

.token.property,
.token.class-name,
.token.constant,
.token.symbol {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.token.selector,
.token.important,
.token.atrule,
.token.keyword,
.token.builtin {
  color: var(--theme-color-purple, var(--default-theme-color-purple));
}

.token.string,
.token.char,
.token.attr-value,
.token.regex,
.token.variable {
  color: var(--theme-color-accent, var(--default-theme-color-accent));
}

.token.operator,
.token.entity,
.token.url {
  color: #67cdcc;
}

.token.important,
.token.bold {
  font-weight: bold;
}
.token.italic {
  font-style: italic;
}

.token.entity {
  cursor: help;
}

.token.inserted {
  color: green;
}
</style>
