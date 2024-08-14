<script setup lang="ts">
import { snippetz } from '@scalar/snippetz'
import {
  type ClientId,
  type TargetId,
  objectToString,
} from '@scalar/snippetz/core'
import { getHighlighter } from 'shikiji'
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  target: TargetId
  client: ClientId
  request: any
}>()

const code = ref('')
const highlightedConfiguration = ref('')
const highlightedResult = ref('')
const highlightedExample = ref('')

async function renderExample() {
  // Code
  code.value = snippetz().print(props.target, props.client, props.request) ?? ''

  // Syntax highlighting for the code
  const shiki = await getHighlighter({
    themes: ['vitesse-dark'],
    langs: ['javascript', 'json'],
  })

  const example =
    `/* Snippetz */

import { snippetz } from '@scalar/snippetz'

const request = ${objectToString(props.request)}

const snippet = snippetz().print('${props.target}', '${props.client}', request)

/* Output */

// ` + code.value.split(`\n`).join(`\n// `)

  highlightedConfiguration.value = shiki.codeToHtml(
    JSON.stringify(props.request, null, 2),
    { lang: 'json', theme: 'vitesse-dark' },
  )
  highlightedResult.value = shiki.codeToHtml(code.value, {
    lang: 'javascript',
    theme: 'vitesse-dark',
  })
  highlightedExample.value = shiki.codeToHtml(example, {
    lang: 'javascript',
    theme: 'vitesse-dark',
  })
}

onMounted(async () => {
  await renderExample()
})

watch(props, renderExample)
</script>

<template>
  <div class="code-block">
    <div class="code-block-content">
      <div
        class="source"
        v-html="highlightedExample" />
    </div>
  </div>
</template>

<style scoped>
.code-block-content {
  border: 2px solid #343a40;
  border-radius: 6px;
  overflow: hidden;
  font-family: monospace;
  width: 100%;
  max-width: 600px;
}

.title {
  background: #343a40;
  color: #868e96;
  padding: 0.75em 1rem calc(0.75em + 2px);
}

.divider {
  color: #868e96;
  background: #343a40;
  padding: 0.75em 1rem calc(0.75em + 2px);
  border-bottom: 2px solid #343a40;
}

:deep(.source) pre {
  margin: 0;
  padding: 0.75rem;
}

pre code {
  color: #adb5bd;
  display: block;
  background: none;
  white-space: pre;
  -webkit-overflow-scrolling: touch;
  overflow-x: auto;
  max-width: 100%;
  min-width: 100px;
  padding: 0;
}

.tab {
  background: none;
  border: none;
  background-color: #343a40;
  padding: 5px 10px;
  font-family: sans-serif;
  font-size: 0.8rem;
  border-radius: 6px 6px 0 0;
  opacity: 0.6;
  margin-right: 4px;
  outline: none;
}

.tab--selected {
  color: #fff;
  opacity: 1;
}
</style>
