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

const useExample = () => {
  emit('import', JSON.stringify(spec, null, 2))
}
</script>
<template>
  <div class="code-editor-header">
    <div class="code-editor-title"><i>Swagger </i>Editor</div>
    <div class="code-editor-header-buttons">
      <button
        type="button"
        @click="useExample">
        <i>Use </i>Example
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
    </div>
  </div>
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
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-editor-header-buttons {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: nowrap;
  justify-content: end;
}

.code-editor-header span {
  font-size: 13px;
  color: var(--theme-color-3);
  font-weight: 600;
  margin-right: 12px;
  position: relative;
  cursor: pointer;
}

.code-editor-title {
  padding: 14px 0;
  border-bottom: 1px solid var(--theme-color-1);
  font-weight: var(--theme-semibold);
  font-size: 13px;
  color: var(--theme-color-1);
  margin-bottom: -1px;
  position: relative;
}

.code-editor-header button {
  border-radius: 30px;
  padding: 6px 9px;
  background: transparent;
  appearance: none;
  border: 1px solid var(--theme-border-color);
  font-size: 12px;
  color: var(--theme-color-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
  margin-left: 9px;
  font-weight: 500;
}
.code-editor-header button:hover {
  cursor: pointer;
  color: var(--theme-color-1);
  border-color: currentColor;
}
@media (max-width: 580px) {
  .code-editor-title i,
  .code-editor-header button i {
    display: none;
  }
  .code-editor-header button {
    padding: 4px 8px;
    margin-left: 6px;
  }
}
</style>
