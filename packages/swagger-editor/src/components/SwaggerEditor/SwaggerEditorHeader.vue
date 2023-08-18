<script setup lang="ts">
import { useFileDialog } from '@vueuse/core'
import { ref, watch } from 'vue'

import spec from '../../petstorev3.json'
import FlowButton from '../FlowButton.vue'
import FlowModal, { useModalState } from '../FlowModal.vue'
import FlowTextField from '../FlowTextField.vue'

const emit = defineEmits<{
  (e: 'import', value: string): void
}>()

const { files, open, reset } = useFileDialog({
  multiple: false,
  accept: '.json,.yaml,.yml',
})

const swaggerURLModalState = useModalState()
const syncGitModal = useModalState()
const swaggerUrl = ref('')

async function fetchURL() {
  const response = await fetch(swaggerUrl.value)
  const data = await response.json()
  emit('import', JSON.stringify(data, null, 4))
  swaggerURLModalState.hide()
}

watch(files, () => {
  if (files.value?.length) {
    const file = files.value[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      if (typeof data !== 'string') return

      emit('import', data)
      reset()
    }
    reader.readAsText(file)
  }
})

const importExampleFile = () => {
  emit('import', JSON.stringify(spec, null, 2))
}
</script>
<template>
  <div class="code-editor-header">
    <div>
      <span class="active-mode"><i>Swagger </i>Editor</span>
    </div>
    <div>
      <button
        type="button"
        @click="importExampleFile">
        <i>Import </i>Example<i> File</i>
      </button>
      <button
        type="button"
        @click="() => open()">
        Import<i> File</i>
      </button>
      <button
        type="button"
        @click="swaggerURLModalState.show">
        <i>Import </i>URL
      </button>
      <button
        type="button"
        @click="syncGitModal.show">
        <i>Sync With </i>Git
      </button>
    </div>
  </div>
  <FlowModal
    :state="syncGitModal"
    title="Sync with Git">
    <div class="flex-col gap-1">
      <h1>coming soon!</h1>
      <FlowButton
        label="Close"
        @click="syncGitModal.hide()" />
    </div>
  </FlowModal>
  <FlowModal
    :state="swaggerURLModalState"
    title="Import Swagger from URL">
    <div class="flex-col gap-1">
      <FlowTextField
        v-model="swaggerUrl"
        autofocus
        label="URL"
        placeholder="https://scalar.com/swagger.json" />
      <div class="flex-mobile gap-1">
        <FlowButton
          label="Cancel"
          variant="outlined"
          @click="swaggerURLModalState.hide()" />
        <FlowButton
          label="Import"
          @click="fetchURL" />
      </div>
    </div>
  </FlowModal>
</template>
<style>
.code-editor-header {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-editor-header span {
  font-size: 13px;
  color: var(--scalar-api-reference-theme-color-3);
  font-weight: 600;
  margin-right: 12px;
  position: relative;
  cursor: pointer;
}

.code-editor-header span.active-mode {
  color: var(--scalar-api-reference-theme-color-1);
}

.code-editor-header span.active-mode:after {
  content: '';
  position: absolute;
  bottom: -18px;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--scalar-api-reference-theme-color-1);
}

.code-editor-header button {
  border-radius: 30px;
  padding: 6px 9px;
  background: transparent;
  appearance: none;
  border: var(--scalar-api-reference-border);
  font-size: 12px;
  color: var(--scalar-api-reference-theme-color-3);
  margin-left: 9px;
  font-weight: 500;
}
.code-editor-header button:hover {
  cursor: pointer;
  color: var(--scalar-api-reference-theme-color-1);
  border-color: currentColor;
}
@media (max-width: 580px) {
  .active-mode i,
  .code-editor-header button i {
    display: none;
  }
  .code-editor-header button {
    padding: 4px 8px;
    margin-left: 6px;
  }
  .code-editor-header span.active-mode:after {
    bottom: -16px;
  }
}
</style>
