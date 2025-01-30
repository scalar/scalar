<script setup lang="ts">
import { type TargetId, snippetz } from '@scalar/snippetz'
import { objectToString } from '@scalar/snippetz/utils'
import { getHighlighter } from 'shikiji'
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  target: string
  client: string
  request: any
}>()

const { print } = snippetz()

const code = ref('')
const highlightedConfiguration = ref('')
const highlightedResult = ref('')
const highlightedExample = ref('')
async function renderExample() {
  // Code
  code.value =
    print(
      props.target as TargetId,
      // @ts-expect-error I don’t know how to type this.
      props.client,
      props.request,
    ) ?? ''
  // Syntax highlighting for the code
  const shiki = await getHighlighter({
    themes: ['dark-plus'],
    langs: ['javascript', 'json'],
  })

  // Generate the example code
  const example = `import { snippetz } from '@scalar/snippetz'

const { print } = snippetz()

const request = ${objectToString(props.request)}

const snippet = print('${props.target}', '${props.client}', request)`

  // Generate the result snippet
  const result = code.value.split(`\r`).join(``).split(`\n`).join(`\n`)

  highlightedConfiguration.value = shiki.codeToHtml(
    JSON.stringify(props.request, null, 2),
    { lang: 'json', theme: 'dark-plus' },
  )
  highlightedResult.value = shiki.codeToHtml(result, {
    lang: 'javascript',
    theme: 'dark-plus',
  })
  highlightedExample.value = shiki.codeToHtml(example, {
    lang: 'javascript',
    theme: 'dark-plus',
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
      <h2>Example</h2>
      <div
        class="source"
        v-html="highlightedExample" />
    </div>
    <div class="code-block-content">
      <h2>Output</h2>
      <div
        class="source"
        v-html="highlightedResult" />
    </div>
  </div>
</template>

<style scoped>
.code-block {
  display: flex;
  gap: 1em;
}
.code-block-content {
  border: 1px solid #2d2d2d;
  border-radius: 6px;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 1em;
  overflow: hidden;
}
.code-block-content h2 {
  border-bottom: 1px solid #2d2d2d;
  font-size: 0.875rem;
  font-weight: 400;
  margin: 0;
  padding: 0.75em 1rem;
}
.divider {
  color: #868e96;
  background: #343a40;
  padding: 0.75em 1rem calc(0.75em + 2px);
  border-bottom: 2px solid #343a40;
}
.source {
  display: flex;
  flex: 1;
  overflow-x: scroll;
}
:deep(.source) pre {
  display: flex;
  flex: 1;
  margin: 0;
  padding: 0.75rem;
}

@media (max-width: 768px) {
  .code-block {
    flex-direction: column;
  }
}
</style>
