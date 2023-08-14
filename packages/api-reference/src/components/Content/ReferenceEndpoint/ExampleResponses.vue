<script lang="ts" setup>
import { json } from '@codemirror/lang-json'
import { useClipboard } from '@scalar/use-clipboard'
import { useCodeMirror } from '@scalar/use-codemirror'
import { EditorView } from 'codemirror'
import { computed, ref, watch } from 'vue'

import type { TransformedOperation } from '../../../types'
import {
  Card,
  CardContent,
  CardFooter,
  CardTab,
  CardTabHeader,
} from '../../Card'
import { Icon } from '../../Icon'

const props = defineProps<{ operation: TransformedOperation }>()

const { copyToClipboard } = useClipboard()

// Bring the status codes in the right order.
const orderedStatusCodes = computed(() => {
  return Object.keys(props.operation.information.responses).sort((x) => {
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

  return props.operation.responses[currentStatusCode]
})

const currentResponseJsonBody = computed(() => {
  return currentResponse.value?.content?.['application/json']?.body
})

const { codeMirrorRef, setCodeMirrorContent } = useCodeMirror({
  content: currentResponseJsonBody.value,
  extensions: [json(), EditorView.editable.of(false)],
})

const changeTab = (index: number) => {
  selectedResponseIndex.value = index
}

watch(selectedResponseIndex, () => {
  setCodeMirrorContent(currentResponseJsonBody.value ?? '')
})
</script>
<template>
  <Card>
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
          v-if="currentResponseJsonBody"
          class="code-copy"
          type="button"
          @click="() => copyToClipboard(currentResponseJsonBody)">
          <Icon
            src="solid/interface-copy-clipboard"
            width="10px" />
        </button>
      </template>
    </CardTabHeader>
    <CardContent
      v-if="currentResponse.description"
      muted>
      <div class="description">
        {{ currentResponse.description }}
      </div>
    </CardContent>
    <CardContent muted>
      <div
        v-show="currentResponseJsonBody"
        ref="codeMirrorRef" />
      <div
        v-if="!currentResponseJsonBody"
        class="scalar-api-reference__empty-state">
        No Body
      </div>
    </CardContent>
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
  color: var(--scalar-api-reference-theme-color-3);
  border: none;
}
.code-copy:hover {
  color: var(--scalar-api-reference-theme-color-1);
}
.code-copy svg {
  width: 13px;
  height: 13px;
}
.description {
  font-weight: var(--scalar-api-reference-theme-semibold);
  font-size: var(--scalar-api-reference-theme-mini);
}
.scalar-api-reference__empty-state {
  border: 1px dashed var(--scalar-api-reference-theme-border-color);
  width: 100%;
  text-align: center;
  font-size: var(--scalar-api-reference-theme-mini);
  padding: 20px;
  color: var(--scalar-api-reference-theme-color-2);
}
</style>
