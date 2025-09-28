<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { computed } from 'vue'

import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import type { EnvVariable } from '@/store/active-entities'
import OperationTableRow, {
  type TableRow,
} from '@/v2/blocks/scalar-operation-block/components/OperationTableRow.vue'

const { data, isReadOnly, hasCheckboxDisabled, showUploadButton } =
  defineProps<{
    data: TableRow[]
    isReadOnly?: boolean
    /** Hide the enabled column */
    hasCheckboxDisabled?: boolean

    invalidParams?: Set<string>
    label?: string
    showUploadButton?: boolean

    /** TODO: remove once we migrate */
    environment: Environment
    envVariables: EnvVariable[]
  }>()

/**
 * Make this component more generic that can be used also for the operation body
 */

const emits = defineEmits<{
  (
    e: 'addRow',
    payload: Partial<{ key: string; value: string; isEnabled: boolean }>,
  ): void
  (
    e: 'updateRow',
    index: number,
    payload: Partial<{ key: string; value: string; isEnabled: boolean }>,
  ): void
  (e: 'deleteRow', index: number): void

  /**
   * File upload events
   *
   * Each row has its own upload button, so we need to know which row to update
   * when the file is selected. If the index is undefined, it means we add the
   * file to the new row at the bottom of the table.
   */
  (e: 'uploadFile', index?: number): void
  (e: 'removeFile', index: number): void
}>()

const uploadFile = (index?: number) => {
  emits('uploadFile', index)
}

const columns = ['36px', '', '', 'auto']

/** Add the last empty row (for ui purposes only) */
const displayData = computed(() => {
  const last = data.at(-1)

  if (!last || (last.name !== '' && last.value !== '')) {
    return [...data, { name: '', value: '', isDisabled: true }]
  }

  return data
})

/**
 * Detect if the incoming event is an add or update and re-emit the event
 */
const updateOrAdd = ({
  index,
  payload,
}: {
  index: number
  payload: Partial<{ key: string; value: string; isEnabled: boolean }>
}) => {
  /** If the update happen on the last row, it means we need to add a new row */
  if (index >= data.length) {
    emits('addRow', payload)
    return
  }

  /** Otherwise we just update the existing row */
  emits('updateRow', index, payload)
}
</script>
<template>
  <DataTable
    class="group/table flex-1"
    :columns="columns">
    <DataTableRow class="sr-only !block">
      <DataTableHeader>{{ label }} Enabled</DataTableHeader>
      <DataTableHeader>{{ label }} Key</DataTableHeader>
      <DataTableHeader>{{ label }} Value</DataTableHeader>
    </DataTableRow>
    <OperationTableRow
      v-for="(row, idx) in displayData"
      :key="idx"
      :data="row"
      :envVariables="envVariables"
      :environment="environment"
      :hasCheckboxDisabled="hasCheckboxDisabled"
      :invalidParams="invalidParams"
      :isReadOnly="isReadOnly"
      :label="label"
      :showUploadButton="showUploadButton"
      @deleteRow="emits('deleteRow', idx)"
      @removeFile="emits('removeFile', idx)"
      @updateRow="(payload) => updateOrAdd({ index: idx, payload })"
      @uploadFile="() => uploadFile(idx)" />
  </DataTable>
</template>
<style scoped>
:deep(.cm-editor) {
  padding: 0;
}
:deep(.cm-content) {
  align-items: center;
  background-color: transparent;
  display: flex;
  font-family: var(--scalar-font);
  font-size: var(--scalar-small);
  padding: 5px 8px;
  width: 100%;
}
:deep(.cm-content):has(.cm-pill) {
  padding: 5px 8px;
}
:deep(.cm-content .cm-pill:not(:last-of-type)) {
  margin-right: 0.5px;
}
:deep(.cm-content .cm-pill:not(:first-of-type)) {
  margin-left: 0.5px;
}
:deep(.cm-line) {
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
}
.filemask {
  mask-image: linear-gradient(
    to right,
    transparent 0,
    var(--scalar-background-2) 20px
  );
}
</style>
