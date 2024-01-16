<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { useClipboard } from '@scalar/use-clipboard'
import { computed, ref } from 'vue'

import type { TransformedOperation } from '../../../../types'
import {
  Card,
  CardContent,
  CardFooter,
  CardTab,
  CardTabHeader,
} from '../../../Card'
import MarkdownRenderer from '../../MarkdownRenderer.vue'
import ExampleResponse from './ExampleResponse.vue'
import RawSchema from './RawSchema.vue'

// import Headers from './Headers.vue'

/**
 * TODO: copyToClipboard isn’t using the right content if there are multiple examples
 */

const props = defineProps<{ operation: TransformedOperation }>()

const { copyToClipboard } = useClipboard()

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

// Keep track of the current selected tab
const selectedResponseIndex = ref<number>(0)

// Return the whole response object
const currentResponse = computed(() => {
  const currentStatusCode =
    orderedStatusCodes.value[selectedResponseIndex.value]

  return props.operation.information?.responses?.[currentStatusCode]
})

const currentJsonResponse = computed(
  () => currentResponse.value?.content?.['application/json'],
)

const changeTab = (index: number) => {
  selectedResponseIndex.value = index
}

const showSchema = ref(false)
</script>
<template>
  <Card v-if="orderedStatusCodes.length">
    <CardTabHeader
      muted
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
            width="10px" />
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
          <RawSchema
            v-if="showSchema"
            :response="currentJsonResponse" />
          <ExampleResponse
            v-else
            :response="currentJsonResponse" />
        </template>
        <!-- Without Schema: Don’t show tabs -->
        <ExampleResponse
          v-else
          :response="currentJsonResponse" />
      </CardContent>
    </div>
    <CardFooter
      v-if="currentResponse?.description"
      class="scalar-card-footer"
      muted>
      <div class="description">
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
  color: var(--theme-color-3, var(--default-theme-color-3));
  border: none;
  padding: 0;
  margin-right: 12px;
}
.code-copy:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.code-copy svg {
  width: 13px;
  height: 13px;
}
.description {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color--1, var(--default-theme-color-1));
  padding: 10px 12px;
  min-height: 35px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.schema-type {
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  background: var(--theme-background-3, var(--default-theme-background-3));
  padding: 2px 4px;
  border-radius: 4px;
  margin-right: 4px;
}
.schema-example {
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}

.example-response-tab {
  display: block;
  margin: 6px;
}
.scalar-card-container {
  flex: 1;
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.scalar-card-container :deep(.cm-scroller) {
  overflow: hidden;
}

.rule-title {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  color: var(--theme-color-1, var(--default-theme-color-1));
  display: inline-block;
  margin: 12px 0 6px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
}

.rule {
  margin: 0 12px 0;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}

.rule-items {
  counter-reset: list-number;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  padding: 12px 0 12px;
}
.rule-item {
  counter-increment: list-number;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  overflow: hidden;
  margin-left: 24px;
}
.rule-item:before {
  /* content: counter(list-number); */
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-top: 0;
  border-right: 0;
  content: ' ';
  display: block;
  width: 24px;
  height: 6px;
  border-radius: 0 0 0 var(--theme-radius-lg, var(--default-theme-radius-lg));
  margin-top: 6px;
  color: var(--theme-color-2, var(--default-theme-color-2));
  transform: translateX(-25px);
  color: var(--theme-color-1, var(--default-theme-color-1));
  position: absolute;
}

.schema-tabs {
  margin-top: 12px;
}

.schema-tabs .tab-list {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  margin-left: 12px;
  display: flex;
  gap: 6px;
  padding-left: 6px;
}

.schema-tabs .tab {
  padding: 5px 8px;
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-2, var(--default-theme-color-2));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-bottom: 1px solid transparent;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg))
    var(--theme-radius-lg, var(--default-theme-radius-lg)) 0 0;
  position: relative;
  bottom: -1px;
}

.schema-tabs .tab--selected {
  color: var(--theme-color-1, var(--default-theme-color-1));
  border-bottom-color: var(
    --theme-background-2,
    var(--default-theme-background-2)
  );
}
.scalar-card-checkbox {
  display: flex;
  align-items: center;
  position: relative;
  padding-right: 27px;
  min-height: 17px;
  cursor: pointer;
  user-select: none;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-2, var(--default-theme-color-2));
  width: fit-content;
  white-space: nowrap;
  margin-right: 9px;
}
.scalar-card-checkbox:hover {
  color: var(--theme-color--1, var(--default-theme-color-1));
}
.scalar-card-checkbox .scalar-card-checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.scalar-card-checkbox-checkmark {
  position: absolute;
  top: 0;
  right: 0;
  height: 17px;
  width: 17px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  background-color: transparent;
  background-color: var(
    --theme-background-3,
    var(--default-theme-background-3)
  );
  box-shadow: inset 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
}
.scalar-card-checkbox:has(.scalar-card-checkbox-input:checked) {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.scalar-card-checkbox
  .scalar-card-checkbox-input:checked
  ~ .scalar-card-checkbox-checkmark {
  background-color: var(--theme-color-1, var(--default-theme-color-1));
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
  left: 7px;
  top: 3.5px;
  width: 4px;
  height: 9px;
  border: solid var(--theme-background-1, var(--default-theme-background-1));
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
</style>
