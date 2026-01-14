<script setup lang="ts">
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { ref, watch } from 'vue'

import { useFileDialog } from '@/hooks'
import RequestTable from '@/v2/blocks/request-block/components/RequestTable.vue'
import { getFormBodyRows } from '@/v2/blocks/request-block/helpers/get-form-body-rows'

const { example, selectedContentType, environment } = defineProps<{
  example: ExampleObject | undefined | null
  selectedContentType: string
  environment: XScalarEnvironment
}>()

const emit = defineEmits<{
  (
    e: 'update:formValue',
    payload: ApiReferenceEvents['operation:update:requestBody:formValue']['payload'],
  ): void
}>()

/** Local state for form body rows */
const localFormBodyRows = ref<
  ApiReferenceEvents['operation:update:requestBody:formValue']['payload']
>([])

/** Sync the local form body rows with the example */
watch(
  () => example,
  (newExample) => {
    localFormBodyRows.value = getFormBodyRows(newExample, selectedContentType)
  },
  { immediate: true },
)

/** Adds a new row safely by defaulting the rest of the values, then emits the update */
const handleAddRow = (
  payload: Partial<{ name: string; value: string | File; isDisabled: boolean }>,
) => {
  localFormBodyRows.value = [
    ...localFormBodyRows.value,
    { name: '', value: '', isDisabled: false, ...payload },
  ]

  emit('update:formValue', localFormBodyRows.value)
}

/** Update a row in the table, combines with the previous data so we emit a whole row */
const handleUpdateRow = (
  index: number,
  payload: Partial<{
    name: string
    value: string | File | undefined
    isDisabled: boolean
  }>,
) => {
  localFormBodyRows.value = localFormBodyRows.value.map((row, i) =>
    i === index ? { ...row, ...payload } : row,
  )

  emit('update:formValue', localFormBodyRows.value)
}

/** Delete a row from the table */
const handleDeleteRow = (index: number) => {
  localFormBodyRows.value = localFormBodyRows.value.filter(
    (_, i) => i !== index,
  )
}

/** Handle file upload for a specific row index */
const handleFileUpload = (index: number) => {
  const { open } = useFileDialog({
    onChange: (files) => {
      const file = files?.[0]

      if (file) {
        if (index >= localFormBodyRows.value.length) {
          handleAddRow({ name: file.name, value: file })
        } else {
          const currentRow = localFormBodyRows.value[index]
          handleUpdateRow(index, {
            name: currentRow?.name || file.name,
            value: file,
          })
        }
      }
    },
    multiple: false,
    accept: '*/*',
  })
  open()
}
</script>

<template>
  <!-- Form Data -->
  <template v-if="selectedContentType === 'multipart/form-data'">
    <RequestTable
      :data="localFormBodyRows"
      :environment="environment"
      showUploadButton
      @addRow="handleAddRow"
      @deleteRow="(index) => handleDeleteRow(index)"
      @removeFile="(index) => handleUpdateRow(index, { value: undefined })"
      @updateRow="(index, payload) => handleUpdateRow(index, payload)"
      @uploadFile="handleFileUpload" />
  </template>

  <!-- Form URL Encoded -->
  <template v-else>
    <RequestTable
      :data="localFormBodyRows"
      :environment="environment"
      @addRow="handleAddRow"
      @deleteRow="handleDeleteRow"
      @updateRow="handleUpdateRow" />
  </template>
</template>
