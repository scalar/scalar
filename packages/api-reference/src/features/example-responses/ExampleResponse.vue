<script lang="ts" setup>
import { getExampleFromSchema } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { ScalarCodeBlock, ScalarVirtualText } from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ExampleObject,
  MediaTypeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { getResolvedRefDeep } from './helpers/get-resolved-ref-deep'

const { example, response } = defineProps<{
  response: MediaTypeObject | undefined
  example: ExampleObject | undefined
}>()

/** Get content from the appropriate source */
const getContent = () => {
  if (example !== undefined) {
    return getResolvedRefDeep(example)?.value ?? ''
  }

  if (response?.schema) {
    return getExampleFromSchema(getResolvedRef(response.schema), {
      emptyString: 'string',
      mode: 'read',
    })
  }

  return ''
}

const VIRTUALIZATION_THRESHOLD = 30_000

// Virtualize the code block if it's too large
const shouldVirtualize = computed(
  () => prettyPrintedContent.value.length > VIRTUALIZATION_THRESHOLD,
)

/** Pre-pretty printed content string, avoids multiple pretty prints*/
const prettyPrintedContent = computed<string>(() =>
  prettyPrintJson(getContent()),
)
</script>
<template>
  <!-- Example -->
  <ScalarCodeBlock
    v-if="example !== undefined && !shouldVirtualize"
    class="bg-b-2 -outline-offset-2"
    lang="json"
    :prettyPrintedContent="prettyPrintedContent" />

  <!-- Schema -->
  <ScalarCodeBlock
    v-else-if="response?.schema && !shouldVirtualize"
    class="bg-b-2 -outline-offset-2"
    lang="json"
    :prettyPrintedContent="prettyPrintedContent" />

  <ScalarVirtualText
    v-else-if="(example !== undefined || response?.schema) && shouldVirtualize"
    containerClass="custom-scroll scalar-code-block border rounded-b flex flex-1 max-h-screen"
    contentClass="language-plaintext whitespace-pre font-code text-base"
    :lineHeight="20"
    :text="prettyPrintedContent" />

  <div
    v-else
    class="empty-state">
    No Body
  </div>
</template>

<style scoped>
.empty-state {
  margin: 10px 0 10px 12px;
  text-align: center;
  font-size: var(--scalar-mini);
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--scalar-radius-lg);
  color: var(--scalar-color-2);
}

.rule-title {
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
  display: inline-block;
  margin: 12px 0 6px;
  border-radius: var(--scalar-radius);
}

.rule {
  margin: 0 12px 0;
  border-radius: var(--scalar-radius-lg);
}

.rule-items {
  counter-reset: list-number;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: 1px solid var(--scalar-border-color);
  padding: 12px 0 12px;
}
.rule-item {
  counter-increment: list-number;
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
  margin-left: 24px;
}
.rule-item:before {
  /* content: counter(list-number); */
  border: 1px solid var(--scalar-border-color);
  border-top: 0;
  border-right: 0;
  content: ' ';
  display: block;
  width: 24px;
  height: 6px;
  border-radius: 0 0 0 var(--scalar-radius-lg);
  margin-top: 6px;
  color: var(--scalar-color-2);
  transform: translateX(-25px);
  color: var(--scalar-color-1);
  position: absolute;
}
</style>
