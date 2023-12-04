<script setup lang="ts">
import { FlowModal, useModal } from '@scalar/use-modal'
import { useFileDialog, useMediaQuery } from '@vueuse/core'
import { ref, watch } from 'vue'

import { fetchSpecFromUrl } from '../../helpers'
import { type SwaggerEditorHeaderProps } from '../../types'
import FlowButton from '../FlowButton.vue'
import FlowTextField from '../FlowTextField.vue'
import HeaderTabButton from './HeaderTabButton.vue'

const props = defineProps<SwaggerEditorHeaderProps>()

const emit = defineEmits<{
  (e: 'import', value: string): void
}>()

const isMobile = useMediaQuery('(max-width: 1000px)')

const { files, open, reset } = useFileDialog({
  multiple: false,
  accept: '.json,.yaml,.yml',
})

const importUrlModal = useModal()
const importUrlError = ref<string | null>(null)

defineExpose({
  importUrlModal,
  openFileDialog: open,
})

const specUrl = ref('')

const handleImportUrl = () => {
  importUrlError.value = ''

  fetchSpecFromUrl(specUrl.value, props.proxyUrl)
    .then(async (content) => {
      emit('import', content)
      importUrlModal.hide()
    })
    .catch((error) => {
      console.error('[importUrl]', error)
      importUrlError.value = error
    })
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
</script>
<template>
  <div class="swagger-editor-header">
    <div class="swagger-editor-title">
      <template v-if="!isMobile">Swagger&nbsp;</template>Editor
    </div>
    <slot name="tab-items" />
    <div class="swagger-editor-actions">
      <HeaderTabButton @click="() => open()">
        Upload<span v-if="!isMobile">&nbsp;File</span>
      </HeaderTabButton>
      <HeaderTabButton @click="importUrlModal.show()">
        <span v-if="!isMobile">Import&nbsp;</span>URL
      </HeaderTabButton>
    </div>
  </div>
  <FlowModal
    :state="importUrlModal"
    title="Import Swagger from URL">
    <div class="swagger-editor-modal-layout">
      <FlowTextField
        v-model="specUrl"
        autofocus
        class="swagger-editor-modal-layout-input"
        label="URL"
        placeholder="https://scalar.com/swagger.json" />
      {{ importUrlError }}
      <FlowButton
        label="Cancel"
        variant="outlined"
        @click="importUrlModal.hide()" />
      <FlowButton
        label="Import"
        @click="handleImportUrl" />
    </div>
  </FlowModal>
</template>
<style scoped>
.swagger-editor-header {
  padding: 11px 6px 0 12px;
  display: flex;
  align-items: center;
  flex-flow: wrap;
  position: relative;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.swagger-editor-title {
  display: flex;
  align-items: center;
  position: relative;

  padding: 9px;
  /* Move down to cover the border below */
  margin-bottom: -1px;

  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-mini, var(--default-theme-mini));

  box-shadow:
    0 1px 0 0px var(--theme-background-2, var(--default-theme-background-2)),
    0px 0 0 1px var(--theme-border-color, var(--default-theme-border-color)),
    0 0 0 1px var(--theme-background-2, var(--default-theme-background-2));
  background: var(--theme-background-2, var(--default-theme-background-2));
  border-radius: var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius)) 0 0;
}
.swagger-editor-heading {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-3, var(--default-theme-color-3));
  text-transform: uppercase;
}
.swagger-editor-modal-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto;
  gap: 12px;
}
.swagger-editor-modal-layout :first-child {
  grid-column: 1 / -1;
}
@media (max-width: 500px) {
  .swagger-editor-modal-layout {
    grid-template-columns: auto;
  }
}
.swagger-editor-actions {
  display: flex;
  flex: 1;
  justify-content: flex-end;
}
</style>
