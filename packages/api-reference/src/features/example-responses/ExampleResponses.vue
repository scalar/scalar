<script lang="ts" setup>
import { ExamplePicker } from '@scalar/blocks/code-example'
import {
  ScalarCard,
  ScalarCardFooter,
  ScalarCardSection,
} from '@scalar/components/card'
import { ScalarIcon } from '@scalar/components/icon'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getExample } from '@scalar/workspace-store/request-example'
import type {
  MediaTypeObject,
  ResponsesObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, inject, ref, toValue, useId, watch } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'
import ExampleSchema from '@/features/example-responses/ExampleSchema.vue'
import { RESPONSE_CONTENT_TYPE_SYMBOL } from '@/features/Operation/response-content-type'

import ExampleResponse from './ExampleResponse.vue'
import ExampleResponseTab from './ExampleResponseTab.vue'
import ExampleResponseTabList from './ExampleResponseTabList.vue'
import { hasResponseContent } from './helpers/has-response-content'
import { normalizeMimeTypeObject } from './helpers/normalize-mime-type-object'

/**
 * TODO: copyToClipboard isn't using the right content if there are multiple examples
 */

const { responses, selectedExample, eventBus } = defineProps<{
  responses: ResponsesObject
  /**
   * The document-wide selected example key. Honored only when the current response defines an
   * example with the same key, so response example pickers stay in sync between operations without
   * blanking out responses that do not share that key.
   */
  selectedExample?: string
  /** Event bus, used to broadcast the selected example so other operations can follow */
  eventBus?: WorkspaceEventBus
}>()

const id = useId()
const { copyToClipboard } = useClipboard()

// Bring the status codes in the right order.
const orderedStatusCodes = computed<string[]>(() =>
  Object.keys(responses ?? {}).sort(),
)

// Filter to only valid response keys that should render in the example responses panel
const statusCodesWithContent = computed<string[]>(() =>
  orderedStatusCodes.value.filter((statusCode) =>
    hasResponseContent(getResolvedRef(responses?.[statusCode]), statusCode),
  ),
)

// Keep track of the current selected tab
const selectedResponseIndex = ref<number>(0)

/**
 * Clamp the selected index when the filtered list shrinks.
 * Without this, the index can become out of bounds and cause a mismatch
 * between the visible tabs and the displayed content.
 *
 * We re-resolve `selectedExampleKey` the same way `changeTab` does, so the picker keeps the
 * document-wide selection when the newly active response defines it instead of being blanked out.
 */
watch(statusCodesWithContent, (codes) => {
  if (codes.length === 0) {
    selectedResponseIndex.value = 0
  } else if (selectedResponseIndex.value >= codes.length) {
    selectedResponseIndex.value = codes.length - 1
  } else {
    return
  }
  selectedExampleKey.value = resolveExampleKey(selectedExample)
})

// Return the whole response object
const currentResponse = computed(() => {
  const currentStatusCode =
    toValue(statusCodesWithContent)[toValue(selectedResponseIndex)] ?? ''

  return getResolvedRef(responses?.[currentStatusCode])
})

const normalizedResponseContent = computed(() =>
  normalizeMimeTypeObject(currentResponse.value?.content),
)

const responseContentTypes = inject(RESPONSE_CONTENT_TYPE_SYMBOL, null)

const currentResponseContent = computed<MediaTypeObject | undefined>(() => {
  const content = normalizedResponseContent.value
  if (!content) return undefined
  const statusCode =
    toValue(statusCodesWithContent)[toValue(selectedResponseIndex)] ?? ''
  const selected = responseContentTypes?.value[statusCode]
  const keys = objectKeys(content)
  return content[
    selected && keys.includes(selected) ? selected : (keys[0] ?? '')
  ]
})

const hasMultipleExamples = computed<boolean>(
  () =>
    !!currentResponseContent.value?.examples &&
    Object.keys(currentResponseContent.value?.examples ?? {}).length > 1,
)

const selectedExampleKey = ref<string>('')

/** Resolve the example key to show, preferring the document-wide selection when this response has it */
const resolveExampleKey = (preferred: string | undefined): string => {
  const keys = Object.keys(currentResponseContent.value?.examples ?? {})
  if (preferred && keys.includes(preferred)) {
    return preferred
  }
  // Keep the current example when it is still valid, otherwise fall back to the first one
  if (selectedExampleKey.value && keys.includes(selectedExampleKey.value)) {
    return selectedExampleKey.value
  }
  return keys[0] ?? ''
}

// Initialize from the document-wide selection, falling back to the first example
selectedExampleKey.value = resolveExampleKey(selectedExample)

// Follow the document-wide selection when it changes and this response has that example
watch(
  () => selectedExample,
  (preferred) => {
    selectedExampleKey.value = resolveExampleKey(preferred)
  },
)

/** Select an example and sync the choice across the document so other operations follow */
const selectExample = (key: string) => {
  selectedExampleKey.value = key
  eventBus?.emit('workspace:update:selected-example', key)
}

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
  // Re-apply the document-wide selection for the newly selected response, falling back to its first example
  selectedExampleKey.value = resolveExampleKey(selectedExample)
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
      <ExampleSchema
        v-if="currentResponseContent?.schema && showSchema"
        :id="id"
        :schema="currentResponseContent?.schema" />

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
      <ExamplePicker
        v-if="hasMultipleExamples"
        class="response-example-selector px-0"
        :examples="currentResponseContent?.examples"
        :modelValue="selectedExampleKey"
        @update:modelValue="selectExample" />
      <div class="response-description">
        <ScalarMarkdown
          v-if="currentResponse?.description"
          class="response-description-markdown"
          :value="currentResponse.description" />
      </div>
    </ScalarCardFooter>
  </ScalarCard>
</template>

<style scoped>
.response-card {
  font-size: var(--scalar-font-size-3);
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
  flex-direction: row-reverse;
  flex-wrap: wrap;
  justify-content: start;
  flex-shrink: 0;
  padding: 7px 12px;
  column-gap: 8px;
}
.response-example-selector {
  flex-shrink: 0;
  margin: -4px;
}
.response-description {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-small);
  color: var(--scalar-color--1);

  box-sizing: border-box;

  flex-grow: 1;
}
.response-description-markdown {
  max-height: 3lh;
}

.response-description-markdown :deep(*) {
  margin: 0;
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
