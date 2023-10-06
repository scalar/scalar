<script setup lang="ts">
import { FlowModal, useModal } from '@scalar/use-modal'
import { useFileDialog } from '@vueuse/core'
import { ref, watch } from 'vue'

import spec from '../../petstorev3.json'
import { type EditorHeaderTabs } from '../../types'
import FlowButton from '../FlowButton.vue'
import FlowTextField from '../FlowTextField.vue'

defineProps<{
  activeTab: EditorHeaderTabs
}>()

const emit = defineEmits<{
  (e: 'import', value: string): void
  (e: 'updateActiveTab', value: EditorHeaderTabs): void
}>()

const { files, open, reset } = useFileDialog({
  multiple: false,
  accept: '.json,.yaml,.yml',
})

const swaggerURLModalState = useModal()
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
  <div class="swagger-editor-header">
    <div
      class="swagger-editor-title"
      :class="{
        'swagger-editor-active': activeTab === 'Getting Started',
      }"
      @click="emit('updateActiveTab', 'Getting Started')">
      <div class="swagger-editor-type">Getting Started</div>
    </div>
    <div
      class="swagger-editor-title"
      :class="{
        'swagger-editor-active': activeTab === 'Swagger Editor',
      }"
      @click="emit('updateActiveTab', 'Swagger Editor')">
      <div class="swagger-editor-type"><i>Swagger </i>Editor</div>
    </div>
  </div>
  <div
    v-show="activeTab === 'Swagger Editor'"
    class="swagger-editor-buttons">
    <div class="swagger-editor-heading">Swagger File</div>
    <div>
      <button
        type="button"
        @click="() => open()">
        Upload File
      </button>
      <button
        type="button"
        @click="swaggerURLModalState.show">
        Paste URL
      </button>
      <button
        type="button"
        @click="useExample">
        Example
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
.swagger-editor-header {
  padding: 11px 12px 0 12px;
  display: flex;
  align-items: center;
  flex-flow: wrap;
  position: relative;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.swagger-editor-header span {
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-weight: 600;
  margin-right: 12px;
  position: relative;
  cursor: pointer;
}

.swagger-editor-title {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  border-radius: var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius)) 0 0;
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(--theme-mini, var(--default-theme-mini));
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}
.swagger-editor-title:hover:after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  border-radius: var(--theme-radius, var(--default-theme-radius));
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.swagger-editor-type {
  padding: 9px;
  user-select: none;
  position: relative;
  z-index: 1;
}
.swagger-editor-buttons {
  display: flex;
  justify-content: space-between;
  padding: 0 12px 0 18px;
  height: 35px;
  min-height: 35px;
  align-items: center;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  background: var(--theme-background-1, var(--default-theme-background-1));
}
.swagger-editor-active {
  /* use layered box shadow so opaque border overlap doesn't show  */
  box-shadow: 0 1px 0 0px
      var(--theme-background-1, var(--default-theme-background-1)),
    0px 0 0 1px var(--theme-border-color, var(--default-theme-border-color)),
    0 0 0 1px var(--theme-background-1, var(--default-theme-background-1));
  cursor: default;
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.swagger-editor-buttons button {
  background: transparent;
  appearance: none;
  outline: none;
  border: none;
  color: var(--theme-color-1, var(--default-theme-color-1));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
  padding: 4px 6px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-font-size-4, var(--default-theme-font-size-4));
  user-select: none;
  display: flex;
  align-items: center;
}
.swagger-editor-buttons button svg {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}
.swagger-editor-buttons div {
  display: flex;
}
.swagger-editor-buttons button:hover {
  cursor: pointer;
  border-color: currentColor;
  background: var(--theme-background-2, var(--default-theme-background-2));
}
@media (max-width: 580px) {
  .swagger-editor-title i,
  .swagger-editor-header button i {
    display: none;
  }
  .swagger-editor-header button {
    padding: 4px 8px;
    margin-left: 6px;
  }
}
.swagger-editor-heading {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-3, var(--default-theme-color-3));
  text-transform: uppercase;
}
</style>
