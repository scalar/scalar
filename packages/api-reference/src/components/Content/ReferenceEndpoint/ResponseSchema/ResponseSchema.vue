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
        <!-- <RawSchema :response="currentJsonResponse" /> -->
        <ExampleResponse :response="currentJsonResponse" />
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
.scalar-api-reference__empty-state {
  margin: 10px 0 10px 12px;
  text-align: center;
  font-size: var(--theme-micro, var(--default-theme-micro));
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  color: var(--theme-color-2, var(--default-theme-color-2));
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
</style>
