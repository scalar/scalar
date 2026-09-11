<script lang="ts" setup>
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarVirtualCodeBlock } from '@scalar/components/virtual-code-block'
import type {
  ExampleObject,
  MediaTypeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

import { getExampleContent } from './helpers/get-example-content'

const { example, response, content } = defineProps<{
  response: MediaTypeObject | undefined
  example: ExampleObject | undefined
  /** Reuse the card's formatted value so generation and copying cannot diverge. */
  content?: string
}>()
const { translate } = useLocalization()

/** Preformatted content is shared with the response card clipboard action. */
const prettyPrintedContent = computed(
  () => content ?? getExampleContent(response, example),
)

const VIRTUALIZATION_THRESHOLD = 20_000

// Virtualize the code block if it's too large
const shouldVirtualize = computed(() => {
  if (prettyPrintedContent.value === undefined) {
    return false
  }
  return prettyPrintedContent.value.length > VIRTUALIZATION_THRESHOLD
})
</script>
<template>
  <!-- Example -->
  <ScalarCodeBlock
    v-if="prettyPrintedContent !== undefined && !shouldVirtualize"
    class="bg-b-2"
    lang="json"
    :prettyPrintedContent="prettyPrintedContent" />

  <ScalarVirtualCodeBlock
    v-else-if="prettyPrintedContent !== undefined && shouldVirtualize"
    class="bg-b-2"
    :content="prettyPrintedContent"
    lang="json" />

  <div
    v-else
    class="empty-state">
    {{ translate('response.noBody') }}
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
