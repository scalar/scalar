<script lang="ts" setup>
import { useClipboard } from '@scalar/use-clipboard'
import { CodeMirror } from '@scalar/use-codemirror'
import { computed, ref } from 'vue'

import { generateResponseContent, mapFromObject } from '../../../../helpers'
import type { TransformedOperation } from '../../../../types'
import {
  Card,
  CardContent,
  CardFooter,
  CardTab,
  CardTabHeader,
} from '../../../Card'
import { Icon } from '../../../Icon'
import MarkdownRenderer from '../../MarkdownRenderer.vue'
// import Headers from './Headers.vue'
import SelectExample from './SelectExample.vue'

/**
 * TODO: copyToClipboard isn’t using the right content if there are multiple examples
 */

const props = defineProps<{ operation: TransformedOperation }>()

const prettyPrintJson = (value: string) => {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    console.log('Error parsing JSON', value)

    return value
  }
}

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

  return props.operation.information?.responses[currentStatusCode]
})

const currentResponseExamples = computed(() => {
  return currentResponse.value?.content?.['application/json']?.examples
})

const currentResponseExample = computed(() => {
  const example = currentResponse.value?.content?.['application/json']?.example

  if (example) {
    return prettyPrintJson(example)
  }

  const schema = currentResponse.value?.content?.['application/json']?.schema
  if (schema) {
    return prettyPrintJson(generateResponseContent(schema))
  }

  return ''
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
    <div class="card-container custom-scroll">
      <!-- Commenting out until we re-organize cause of height issues -->
      <!-- <CardContent
        v-if="currentResponse.headers"
        muted>
        <Headers :headers="currentResponse.headers" />
      </CardContent> -->
      <CardContent muted>
        <template
          v-if="
            currentResponseExamples &&
            Object.keys(currentResponseExamples).length > 1
          ">
          {{ currentResponseExamples.length }}
          <SelectExample :examples="currentResponseExamples" />
        </template>
        <template
          v-else-if="
            currentResponseExamples &&
            Object.keys(currentResponseExamples).length === 1
          ">
          <CodeMirror
            :content="
              prettyPrintJson(
                mapFromObject(currentResponseExamples)[0].value.value,
              )
            "
            :languages="['json']"
            readOnly />
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
    </div>
    <CardFooter
      v-if="currentResponse?.description"
      class="card-footer"
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
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
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
.card-container {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.card-container :deep(.cm-scroller) {
  overflow: hidden;
}
</style>
