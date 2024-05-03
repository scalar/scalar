<script lang="ts" setup>
import { ScalarCodeBlock, ScalarIcon } from '@scalar/components'
import {
  type TransformedOperation,
  normalizeMimeTypeObject,
} from '@scalar/oas-utils'
import { computed, ref } from 'vue'

import { useClipboard } from '../../../../hooks'
import {
  Card,
  CardContent,
  CardFooter,
  CardTab,
  CardTabHeader,
} from '../../../Card'
import { MarkdownRenderer } from '../../../MarkdownRenderer'
import ExamplePicker from '../ExamplePicker.vue'
import ExampleResponse from './ExampleResponse.vue'

// import Headers from './Headers.vue'

/**
 * TODO: copyToClipboard isn’t using the right content if there are multiple examples
 */

const props = defineProps<{ operation: TransformedOperation }>()

const { copyToClipboard } = useClipboard()

const selectedExampleKey = ref<string>()

// Bring the status codes in the right order.
const orderedStatusCodes = computed(() => {
  return Object.keys(props?.operation?.information?.responses ?? {}).sort(
    (x) => {
      if (x === 'default') {
        return -1
      }

      return 0
    },
  )
})

const hasMultipleExamples = computed<boolean>(
  () => !!currentJsonResponse.value.examples,
)

// Keep track of the current selected tab
const selectedResponseIndex = ref<number>(0)

// Return the whole response object
const currentResponse = computed(() => {
  const currentStatusCode =
    orderedStatusCodes.value[selectedResponseIndex.value]

  return props.operation.information?.responses?.[currentStatusCode]
})

const currentJsonResponse = computed(() => {
  const normalizedContent = normalizeMimeTypeObject(
    currentResponse.value?.content,
  )

  return (
    // OpenAPI 3.x
    normalizedContent?.['application/json'] ??
    // Swagger 2.0
    currentResponse.value
  )
})
const currentResponseWithExample = computed(() => ({
  ...currentJsonResponse.value,
  example:
    hasMultipleExamples.value && selectedExampleKey.value
      ? currentJsonResponse.value.examples[selectedExampleKey.value].value ??
        currentJsonResponse.value.examples[selectedExampleKey.value]
      : currentJsonResponse.value.example,
}))

const changeTab = (index: number) => {
  selectedResponseIndex.value = index
}

const showSchema = ref(false)
</script>
<template>
  <Card v-if="orderedStatusCodes.length">
    <CardTabHeader
      muted
      x="as"
      @change="changeTab">
      <CardTab
        v-for="statusCode in orderedStatusCodes"
        :key="statusCode">
        {{ statusCode }}
      </CardTab>

      <template #actions>
        <button
          v-if="currentJsonResponse?.example"
          class="code-copy"
          type="button"
          @click="() => copyToClipboard(currentJsonResponse?.example)">
          <ScalarIcon
            icon="Clipboard"
            width="10px"
            x="asd" />
        </button>
        <label
          v-if="currentJsonResponse?.schema"
          class="scalar-card-checkbox">
          Show Schema
          <input
            v-model="showSchema"
            class="scalar-card-checkbox-input"
            type="checkbox" />
          <span class="scalar-card-checkbox-checkmark"></span>
        </label>
      </template>
    </CardTabHeader>
    <div class="scalar-card-container custom-scroll">
      <!-- Commenting out until we re-organize cause of height issues -->
      <!-- <CardContent
        v-if="currentResponse.headers"
        muted>
        <Headers :headers="currentResponse.headers" />
      </CardContent> -->
      <CardContent muted>
        <template v-if="currentJsonResponse?.schema">
          <ScalarCodeBlock
            v-if="showSchema && currentResponseWithExample"
            :content="currentResponseWithExample"
            lang="json" />
          <ExampleResponse
            v-else
            :response="currentResponseWithExample" />
        </template>
        <!-- Without Schema: Don’t show tabs -->
        <ExampleResponse
          v-else
          :response="currentResponseWithExample" />
      </CardContent>
    </div>
    <CardFooter
      v-if="currentResponse?.description || hasMultipleExamples"
      class="response-card-footer"
      muted>
      <ExamplePicker
        v-if="hasMultipleExamples"
        class="response-example-selector"
        :examples="currentJsonResponse?.examples"
        @update:modelValue="(value) => (selectedExampleKey = value)" />
      <div
        v-else-if="currentResponse?.description"
        class="response-description">
        <MarkdownRenderer
          class="markdown"
          :value="currentResponse.description" />
      </div>
    </CardFooter>
  </Card>
</template>

<style scoped>
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
  flex-direction: column;
  flex-shrink: 0;
  padding: 10px 12px;
  gap: 8px;
  border-top: 1px solid var(--scalar-border-color);
}
.response-example-selector {
  align-self: start;
  margin: -4px;
}
.response-description {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-micro);
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
.scalar-card-container {
  flex: 1;
  background: var(--scalar-background-2);
}
.scalar-card-container :deep(.cm-scroller) {
  overflow-y: hidden;
}

.scalar-card-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 17px;
  cursor: pointer;
  user-select: none;
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
  width: fit-content;
  white-space: nowrap;
  margin-right: 9px;
  gap: 6px;
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
  height: 17px;
  width: 17px;
  border-radius: var(--scalar-radius);
  background-color: transparent;
  background-color: var(--scalar-background-3);
  box-shadow: inset 0 0 0 1px var(--scalar-border-color);
}
.scalar-card-checkbox:has(.scalar-card-checkbox-input:checked) {
  color: var(--scalar-color-1);
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
  right: 6px;
  top: 36.5%;
  width: 5px;
  height: 9px;
  border: solid 1px var(--scalar-button-1-color);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
</style>
