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

/** Update a row in the table, combines with the previous data so we emit a whole row */
const handleUpsertRow = (
  index: number,
  payload: Partial<{
    name: string
    value: string | File | undefined
    isDisabled: boolean
  }>,
) => {
  // Add new row
  if (index >= localFormBodyRows.value.length) {
    localFormBodyRows.value = [
      ...localFormBodyRows.value,
      { name: '', value: '', ...payload, isDisabled: false },
    ]
    emit('update:formValue', localFormBodyRows.value)
    return
  }

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
  emit('update:formValue', localFormBodyRows.value)
}

/** Handle file upload for a specific row index */
const handleFileUpload = (index: number) => {
  const { open } = useFileDialog({
    onChange: (files) => {
      const file = files?.[0]

      if (file) {
        const currentRow = localFormBodyRows.value[index]
        handleUpsertRow(index, {
          name: currentRow?.name || file.name,
          value: file,
        })
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
      @deleteRow="handleDeleteRow"
      @removeFile="(index) => handleUpsertRow(index, { value: undefined })"
      @uploadFile="handleFileUpload"
      @upsertRow="handleUpsertRow" />
  </template>

  <!-- Form URL Encoded -->
  <template v-else>
    <RequestTable
      :data="localFormBodyRows"
      :environment="environment"
      @deleteRow="handleDeleteRow"
      @upsertRow="handleUpsertRow" />
  </template>
</template>
