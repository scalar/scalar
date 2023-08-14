<script lang="ts" setup>
import { json } from '@codemirror/lang-json'
import { useClipboard } from '@scalar/use-clipboard'
import { useCodeMirror } from '@scalar/use-codemirror'
import { EditorView } from 'codemirror'
import { computed } from 'vue'

import type { Operation } from '../../../types'
import { Card, CardContent, CardTab, CardTabHeader } from '../../Card'
import { Icon } from '../../Icon'

const props = defineProps<{ operation: Operation }>()

const { copyToClipboard } = useClipboard()

const statusCodes = computed(() => {
  return Object.keys(props.operation.information.responses).sort((x) => {
    if (x === 'default') {
      return -1
    }

    return 0
  })
})

function getContentByIndex(index: number): string {
  const selectedResponse = statusCodes.value[index]

  // @ts-ignore
  return props.operation.responses[selectedResponse]
    ? JSON.stringify(
        // @ts-ignore
        props.operation.responses[selectedResponse]['application/json'].content,
        null,
        2,
      )
    : ''
}

const { codeMirrorRef, setCodeMirrorContent, codeMirror, value } =
  useCodeMirror({
    content: getContentByIndex(0),
    extensions: [json(), EditorView.editable.of(false)],
  })

function changeTab(index: number) {
  setCodeMirrorContent(getContentByIndex(index))
}
</script>
<template>
  <Card>
    <CardTabHeader
      muted
      @change="changeTab">
      <CardTab
        v-for="statusCode in statusCodes"
        :key="statusCode">
        {{ statusCode }}
      </CardTab>

      <template #actions>
        <button
          v-if="value"
          class="code-copy"
          type="button"
          @click="
            () => copyToClipboard(codeMirror?.state.doc.toString() ?? '')
          ">
          <Icon
            src="solid/interface-copy-clipboard"
            width="10px" />
        </button>
      </template>
    </CardTabHeader>
    <CardContent muted>
      <div
        v-show="value"
        ref="codeMirrorRef" />
      <div
        v-if="!value"
        class="scalar-api-reference__empty-state">
        No Body
      </div>
    </CardContent>
  </Card>
</template>

<style>
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

.scalar-api-reference__empty-state {
  border: 1px dashed var(--scalar-api-reference-theme-border-color);
  width: 100%;
  text-align: center;
  font-size: var(--scalar-api-reference-theme-mini);
  padding: 20px;
  color: var(--scalar-api-reference-theme-color-2);
}
</style>
