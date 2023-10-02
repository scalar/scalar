<script lang="ts" setup>
import { useClipboard } from '@scalar/use-clipboard'
import { CodeMirror } from '@scalar/use-codemirror'
import { computed, ref } from 'vue'

import type { TransformedOperation } from '../../../../types'
import {
  Card,
  CardContent,
  CardFooter,
  CardTab,
  CardTabHeader,
} from '../../../Card'
import { Icon } from '../../../Icon'
import Headers from './Headers.vue'
import SelectExample from './SelectExample.vue'

const props = defineProps<{ operation: TransformedOperation }>()

const { copyToClipboard } = useClipboard()

// Bring the status codes in the right order.
const orderedStatusCodes = computed(() => {
  return Object.keys(props?.operation?.responses ?? {}).sort((x) => {
    if (x === 'default') {
      return -1
    }

    return 0
  })
})

// Keep track of the current selected tab
const selectedResponseIndex = ref<number>(0)

// Return the whole response object
const currentResponse = computed(() => {
  const currentStatusCode =
    orderedStatusCodes.value[selectedResponseIndex.value]

  return props.operation.responses?.[currentStatusCode]
})

const currentResponseExamples = computed(() => {
  const examples =
    currentResponse.value?.content?.['application/json']?.examples

  if (examples) {
    return JSON.parse(examples)
  }

  return false
})

const currentResponseExample = computed(() => {
  return currentResponse.value?.content?.['application/json']?.example
})

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
          v-if="currentResponseExample"
          class="code-copy"
          type="button"
          @click="() => copyToClipboard(currentResponseExample)">
          <Icon
            src="solid/interface-copy-clipboard"
            width="10px" />
        </button>
      </template>
    </CardTabHeader>
    <CardContent
      v-if="currentResponse.headers"
      muted>
      <Headers :headers="currentResponse.headers" />
    </CardContent>
    <CardContent muted>
      <template v-if="currentResponseExamples">
        <SelectExample :examples="currentResponseExamples" />
      </template>
      <template v-else>
        <CodeMirror
          v-show="currentResponseExample"
          :content="currentResponseExample"
          :languages="['json']"
          readOnly />
        <div
          v-if="!currentResponseExample"
          class="scalar-api-reference__empty-state">
          No Body
        </div>
      </template>
    </CardContent>
    <CardFooter
      v-if="currentResponse?.description"
      muted>
      <div class="description">
        {{ currentResponse.description }}
      </div>
    </CardFooter>
  </Card>
</template>

<style scoped>
.code-copy {
  display: flex;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  color: var(--theme-color-3, var(--default-theme-color-3));
  border: none;
  padding: 0;
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
}
.scalar-api-reference__empty-state {
  border: 1px dashed
    var(--theme-border-color, var(--default-theme-border-color));
  width: calc(100% - 24px);
  margin: 10px 12px;
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
</style>
