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
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <g>
            <path
              d="M24 2.2A2.21 2.21 0 0 0 21.8 0h-4.41a1.23 1.23 0 1 0 0 2.45h3.91a.25.25 0 0 1 .25.25v18.6a.25.25 0 0 1-.25.25h-3.91a1.23 1.23 0 1 0 0 2.45h4.41a2.21 2.21 0 0 0 2.2-2.2Z"
              fill="currentColor"></path>
            <path
              d="M0 2.2v19.6A2.21 2.21 0 0 0 2.2 24h4.41a1.23 1.23 0 1 0 0-2.45H2.7a.25.25 0 0 1-.25-.25V2.7a.25.25 0 0 1 .25-.25h3.91a1.23 1.23 0 1 0 0-2.45H2.2A2.21 2.21 0 0 0 0 2.2Z"
              fill="currentColor"></path>
            <path
              d="M16.9 13a1 1 0 0 0 .74-1.62l-4.9-5.64a1 1 0 0 0-1.48 0l-4.9 5.64A1 1 0 0 0 7.1 13h3.18a.25.25 0 0 1 .25.25v5.49a1.47 1.47 0 0 0 2.94 0v-5.51a.25.25 0 0 1 .25-.25Z"
              fill="currentColor"></path>
          </g>
        </svg>
        Upload File
      </button>
      <button
        type="button"
        @click="swaggerURLModalState.show">
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <g fill="currentColor">
            <path
              d="M10.5 18.4 7.7 21a2.9 2.9 0 0 1-4 0l-.8-.9a2.8 2.8 0 0 1-.8-2 2.7 2.7 0 0 1 .8-2l5.8-5.8a2.8 2.8 0 0 1 4 0l.8 1A1 1 0 1 0 15 10l-.9-.9a4.8 4.8 0 0 0-6.7 0L1.5 15a4.8 4.8 0 0 0 0 6.8l.9.9a4.8 4.8 0 0 0 6.7 0l2.8-2.8a1 1 0 0 0 0-1.4 1 1 0 0 0-1.4 0Z"></path>
            <path
              d="m22.5 2.4-.9-1a4.8 4.8 0 0 0-6.7 0l-2.9 3a1 1 0 1 0 1.4 1.4l3-3a2.8 2.8 0 0 1 3.9 0l.9 1a2.7 2.7 0 0 1 .8 2 2.8 2.8 0 0 1-.8 2l-5.8 5.8a2.8 2.8 0 0 1-2 .8 2.8 2.8 0 0 1-2-.8 1 1 0 0 0-1.4 1.3 4.8 4.8 0 0 0 3.4 1.4 4.8 4.8 0 0 0 3.4-1.4l5.8-5.8a4.8 4.8 0 0 0 0-6.7Z"></path>
          </g>
        </svg>
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
  padding: 12px;
  display: flex;
  align-items: center;
  flex-flow: wrap;
  position: relative;
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
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-mini, var(--default-theme-mini));
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}
.swagger-editor-title:hover {
  background: var(--theme-background-3, var(--default-theme-background-3));
}
.swagger-editor-title + .swagger-editor-title {
  margin-left: 6px;
}
.swagger-editor-type {
  padding: 9px;
  user-select: none;
  position: relative;
}
.swagger-editor-buttons {
  display: flex;
  justify-content: space-between;
  padding: 0 12px 0 18px;
  height: 35px;
  min-height: 35px;
  align-items: center;
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.swagger-editor-active {
  background: var(--theme-background-2, var(--default-theme-background-2));
  cursor: default;
}
.swagger-editor-buttons button {
  background: transparent;
  appearance: none;
  outline: none;
  border: none;
  color: var(--theme-color-3, var(--default-theme-color-3));
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
  background: var(--theme-background-3, var(--default-theme-background-3));
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
