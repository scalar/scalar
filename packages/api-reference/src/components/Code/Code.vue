<script lang="ts" setup>
import { highlightElement, plugins } from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/plugins/autoloader/prism-autoloader.js'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers.js'
import 'prismjs/themes/prism-tomorrow.min.css'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

/**
 * We use prism.js for syntax highlighting
 * If adding a new language make sure to import the component up top
 * as well as add to the type above
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
  return props.lang === 'node' ? 'javascript' : props.lang
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
<style scoped>
pre[class*='language-'] {
  margin: 0;
  padding: 0.5rem;
  background: var(--theme-background-2, var(--default-theme-background-2));
}
</style>
