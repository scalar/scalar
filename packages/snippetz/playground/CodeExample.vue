<script setup lang="ts">
import { basicLanguages, syntaxHighlight } from '@scalar/code-highlight'
import {
  type ClientId,
  type TargetId,
  objectToString,
  snippetz,
} from '@scalar/snippetz'
import { computed } from 'vue'

const props = defineProps<{
  target: TargetId
  client: ClientId<TargetId>
  request: any
}>()

const { print } = snippetz()

const code = computed(
  () => print(props.target, props.client, props.request) ?? '',
)

const output = computed(() =>
  syntaxHighlight(code.value.split(`\r`).join(``), {
    lang: 'plaintext',
    languages: basicLanguages,
  }),
)

const highlightedExample = computed(() =>
  syntaxHighlight(
    `/* Snippetz */
import { snippetz } from '@scalar/snippetz'

const { print } = snippetz()

const request = ${objectToString(props.request)}

const snippet = print('${props.target}', '${props.client}', request)
`,
    {
      lang: 'javascript',
      languages: basicLanguages,
    },
  ),
)
</script>

<template>
  <div class="code-block">
    <h2>Configuration</h2>
    <div
      class="code"
      v-html="highlightedExample" />
    <h2>Output</h2>
    <div
      class="output"
      v-html="output" />
  </div>
</template>

<style scoped>
.code-block {
  display: flex;
  gap: 1rem;
  flex-direction: column;
  padding-bottom: 3rem;
}

.code,
.output {
  flex: 1;
  padding: 1rem;
  border: 1px solid var(--scalar-background-accent);
  border-radius: var(--scalar-radius-lg);
  /** scrollbar */
  overflow-y: auto;
  line-height: 1.4;
}

h2 {
  font-weight: normal;
  font-size: 1rem;
}
</style>
