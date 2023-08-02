<script setup lang="ts">
import { json } from '@codemirror/lang-json'
import { foldGutter } from '@codemirror/language'
import { EditorView } from 'codemirror'
import { computed, onMounted, ref, watch } from 'vue'

import { useClipboard } from '@lib/hooks/useClipboard'
import { useCodeMirror } from '@lib/hooks/useCodeMirror'
import ProjectIcon from '@lib/icon-library/ProjectIcon.vue'

import { ApiReferenceClasses } from '../../../styles'
import type { Operation } from '../../../types'
import ExampleResponseTab from './ExampleResponseTab.vue'

const props = defineProps<{ operation: Operation }>()

const { copyToClipboard } = useClipboard()

const getActiveResponseDefaultValue = () => {
  const responses = props.operation.information.responses
  const keys = Object.keys(responses)

  if (keys.includes('default')) {
    return 'default'
  }

  if (keys.includes('200')) {
    return '200'
  }

  return keys[0]
}

const activeResponse = ref(getActiveResponseDefaultValue())

const copyTeleportRef = ref<HTMLElement>()

const jsonify = (obj: any) => JSON.stringify(obj, null, 2)

const doc = computed(() => {
  const response = props.operation.information.responses[activeResponse.value]

  return jsonify(response)
})

const keys = computed(() => {
  return Object.keys(props.operation.information.responses).sort((x) => {
    if (x === 'default') {
      return -1
    }

    return 0
  })
})

const { codeMirrorRef, setCodeMirrorContent } = useCodeMirror({
  content: doc.value,
  extensions: [json(), foldGutter(), EditorView.editable.of(false)],
})

onMounted(() => {
  watch(activeResponse, () => {
    setCodeMirrorContent(doc.value)
  })
})
</script>
<template>
  <div
    class="endpoint-teleport-response"
    :class="ApiReferenceClasses.CodeMenu">
    <div class="coder">
      <div class="codemenu-topbar codemenu-topbar__tabs">
        <div class="codemenu">
          <div class="codemenu-tabs">
            <div
              v-for="key in keys"
              :key="key"
              class="codemenu-item"
              :class="{
                'codemenu-item__disabled': keys.length === 1,
                'codemenu-item__active':
                  keys.length > 1 && activeResponse === key,
              }"
              @click="activeResponse = key">
              <ExampleResponseTab :title="key" />
            </div>
          </div>
          <div ref="copyTeleportRef" />
          <button
            class="code-copy"
            type="button"
            @click="() => copyToClipboard(doc)">
            <ProjectIcon
              src="solid/interface-copy-clipboard"
              width="10px" />
          </button>
        </div>
      </div>
      <div ref="codeMirrorRef" />
    </div>
  </div>
</template>
<style scoped>
.endpoint-teleport-response {
  margin-top: 12px;
}
.coder {
  border-radius: var(--theme-radius-lg);
  overflow: hidden;
}
.endpoint-teleport-response :deep(.cm-editor .cm-scroller) {
  max-height: calc(50vh - 100px);
}
.codemenu-topbar__tabs {
  padding: 0 6px;
}
.code-copy {
  display: flex;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  color: var(--theme-color-3);
  margin-left: 6px;
  border: none;
  border-radius: 3px;
  padding: 5px;
}
.code-copy:hover {
  color: var(--theme-color-1);
}
.code-copy svg {
  width: 13px;
  height: 13px;
}

.endpoint-teleport-response:hover .code-copy {
  opacity: 1;
}
</style>
../../../types
