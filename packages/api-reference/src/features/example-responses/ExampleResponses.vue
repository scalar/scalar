<script lang="ts" setup>
import { getExample } from '@scalar/api-client/v2/blocks/operation-block'
import {
  ExamplePicker,
  getResolvedRefDeep,
} from '@scalar/api-client/v2/blocks/operation-code-sample'
import {
  ScalarCard,
  ScalarCardFooter,
  ScalarCardSection,
  ScalarCodeBlock,
  ScalarIcon,
  ScalarMarkdown,
} from '@scalar/components'
import {
  getObjectKeys,
  normalizeMimeTypeObject,
} from '@scalar/oas-utils/helpers'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  MediaTypeObject,
  ResponsesObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, toValue, useId, watch } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'

import ExampleResponse from './ExampleResponse.vue'
import ExampleResponseTab from './ExampleResponseTab.vue'
import ExampleResponseTabList from './ExampleResponseTabList.vue'
import { hasResponseContent } from './has-response-content'

/**
 * TODO: copyToClipboard isn't using the right content if there are multiple examples
 */

const { responses } = defineProps<{
  responses: ResponsesObject
}>()

const id = useId()
const { copyToClipboard } = useClipboard()

// Bring the status codes in the right order.
const orderedStatusCodes = computed<string[]>(() =>
  Object.keys(responses ?? {}).sort(),
)

// Filter to only status codes that have response content
const statusCodesWithContent = computed<string[]>(() =>
  orderedStatusCodes.value.filter((statusCode) =>
    hasResponseContent(getResolvedRef(responses?.[statusCode])),
  ),
)

// Keep track of the current selected tab
const selectedResponseIndex = ref<number>(0)

/**
 * Clamp the selected index when the filtered list shrinks.
 * Without this, the index can become out of bounds and cause a mismatch
 * between the visible tabs and the displayed content.
 *
 * We also reset `selectedExampleKey` to match the behavior of `changeTab`,
 * since the new response may not have the same example keys.
 */
watch(statusCodesWithContent, (codes) => {
  if (codes.length === 0) {
    selectedResponseIndex.value = 0
    selectedExampleKey.value = ''
  } else if (selectedResponseIndex.value >= codes.length) {
    selectedResponseIndex.value = codes.length - 1
    selectedExampleKey.value = ''
  }
})

// Return the whole response object
const currentResponse = computed(() => {
  const currentStatusCode =
    toValue(statusCodesWithContent)[toValue(selectedResponseIndex)] ?? ''

  return getResolvedRef(responses?.[currentStatusCode])
})

const currentResponseContent = computed<MediaTypeObject | undefined>(() => {
  const normalizedContent = normalizeMimeTypeObject(
    currentResponse.value?.content,
  )

  /** All the keys of the normalized content */
  const keys = getObjectKeys(normalizedContent ?? {})

  return (
    // OpenAPI 3.x
    normalizedContent?.['application/json'] ??
    normalizedContent?.['application/xml'] ??
    normalizedContent?.['text/plain'] ??
    normalizedContent?.['text/html'] ??
    normalizedContent?.['*/*'] ??
    // Take the first key - in the future we may want to use the selected content type
    normalizedContent?.[keys[0] ?? ''] ??
    undefined
  )
})

const hasMultipleExamples = computed<boolean>(
  () =>
    !!currentResponseContent.value?.examples &&
    Object.keys(currentResponseContent.value?.examples ?? {}).length > 1,
)

const selectedExampleKey = ref<string>(
  Object.keys(currentResponseContent.value?.examples ?? {})[0] ?? '',
)

/** Get the current example to display */
const currentExample = computed(() => {
  if (!currentResponseContent.value) {
    return undefined
  }

  // When multiple examples exist and one is selected, we access it directly
  if (hasMultipleExamples.value && selectedExampleKey.value) {
    return currentResponseContent.value.examples?.[selectedExampleKey.value]
  }

  // Otherwise, we use getExample with an undefined exampleKey to handle fallbacks
  return getExample(currentResponseContent.value, undefined, undefined)
})

const changeTab = (index: number) => {
  selectedResponseIndex.value = index
  selectedExampleKey.value = ''
}

const showSchema = ref(false)
</script>
<template>
  <ScalarCard
    v-if="statusCodesWithContent.length"
    aria-label="Example Responses"
    class="response-card"
    role="region">
    <ExampleResponseTabList @change="changeTab">
      <ExampleResponseTab
        v-for="statusCode in statusCodesWithContent"
        :key="statusCode"
        :aria-controls="id">
        <ScreenReader>Status:</ScreenReader>
        {{ statusCode }}
      </ExampleResponseTab>

      <template #actions>
        <button
          v-if="currentResponseContent?.example"
          class="code-copy"
          type="button"
          @click="() => copyToClipboard(currentResponseContent?.example)">
          <ScalarIcon
            icon="Clipboard"
            width="12px" />
        </button>
        <label
          v-if="currentResponseContent?.schema"
          class="scalar-card-checkbox">
          Show Schema
          <input
            v-model="showSchema"
            :aria-controls="id"
            class="scalar-card-checkbox-input"
            type="checkbox" />
          <span class="scalar-card-checkbox-checkmark" />
        </label>
      </template>
    </ExampleResponseTabList>
    <ScalarCardSection class="grid flex-1">
      <!-- Schema -->
      <ScalarCodeBlock
        v-if="showSchema && currentResponseContent?.schema"
        :id="id"
        :content="getResolvedRefDeep(currentResponseContent?.schema)"
        lang="json" />

      <!-- Example -->
      <ExampleResponse
        v-else
        :id="id"
        :example="currentExample"
        :response="currentResponseContent" />
    </ScalarCardSection>
    <ScalarCardFooter
      v-if="currentResponse?.description || hasMultipleExamples"
      class="response-card-footer">
      <div
        v-if="currentResponse?.description"
        class="response-description">
        <ScalarMarkdown
          class="markdown"
          :value="currentResponse.description" />
      </div>
      <ExamplePicker
        v-if="hasMultipleExamples"
        v-model="selectedExampleKey"
        class="response-example-selector"
        :examples="currentResponseContent?.examples" />
    </ScalarCardFooter>
  </ScalarCard>
</template>

<style scoped>
.response-card {
  font-size: var(--scalar-font-size-3);
}

.markdown :deep(*) {
  margin: 0;
}
.code-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  color: var(--scalar-color-3);
  border: none;
  padding: 0;
  margin-right: 12px;
}
.code-copy:hover {
  color: var(--scalar-color-1);
}
.code-copy svg {
  width: 13px;
  height: 13px;
}
.response-card-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 7px 12px;
  gap: 8px;
}
.response-example-selector {
  align-self: flex-start;
  margin: -4px;
}
.response-description {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-small);
  color: var(--scalar-color--1);

  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.schema-type {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  background: var(--scalar-background-3);
  padding: 2px 4px;
  border-radius: 4px;
  margin-right: 4px;
}
.schema-example {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
}

.example-response-tab {
  display: block;
  margin: 6px;
}

.scalar-card-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 17px;
  cursor: pointer;
  user-select: none;
  font-size: var(--scalar-small);
  font-weight: var(--scalar-font-normal);
  color: var(--scalar-color-2);
  width: fit-content;
  white-space: nowrap;
  gap: 6px;
  padding: 7px 6px;
}
.scalar-card-checkbox:has(.scalar-card-checkbox-input:focus-visible)
  .scalar-card-checkbox-checkmark {
  outline: 1px solid var(--scalar-color-accent);
}
.scalar-card-checkbox:hover {
  color: var(--scalar-color--1);
}
.scalar-card-checkbox .scalar-card-checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.scalar-card-checkbox-checkmark {
  height: 16px;
  width: 16px;
  border-radius: var(--scalar-radius);
  background-color: transparent;
  background-color: var(--scalar-background-3);
  box-shadow: inset 0 0 0 var(--scalar-border-width) var(--scalar-border-color);
}
.scalar-card-checkbox:has(.scalar-card-checkbox-input:checked) {
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
}

.scalar-card-checkbox
  .scalar-card-checkbox-input:checked
  ~ .scalar-card-checkbox-checkmark {
  background-color: var(--scalar-button-1);
  box-shadow: none;
}

.scalar-card-checkbox-checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.scalar-card-checkbox
  .scalar-card-checkbox-input:checked
  ~ .scalar-card-checkbox-checkmark:after {
  display: block;
}

.scalar-card-checkbox .scalar-card-checkbox-checkmark:after {
  right: 11.5px;
  top: 12.5px;
  width: 5px;
  height: 9px;
  border: solid 1px var(--scalar-button-1-color);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
</style>
