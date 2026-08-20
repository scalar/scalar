<script setup lang="ts">
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed } from 'vue'

import RequestTableRow, {
  type TableRow,
  type TableRowUpsertPayload,
} from '@/v2/blocks/request-block/components/RequestTableRow.vue'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from '@/v2/components/data-table'

const {
  data,
  hasCheckboxDisabled,
  showUploadButton,
  showAddRowPlaceholder = true,
  environment,
} = defineProps<{
  data: TableRow[]
  /** Hide the enabled column */
  hasCheckboxDisabled?: boolean
  invalidParams?: Set<string>
  label?: string
  showUploadButton?: boolean
  showAddRowPlaceholder?: boolean
  environment: XScalarEnvironment
}>()

/**
 * Make this component more generic that can be used also for the operation body
 */
const emit = defineEmits<{
  (e: 'upsertRow', index: number, payload: TableRowUpsertPayload): void
  (e: 'deleteRow', index: number): void

  /**
   * File upload events
   *
   * Each row has its own upload button, so we need to know which row to update
   * when the file is selected.
   */
  (e: 'uploadFile', index: number): void
  (e: 'removeFile', index: number): void
  (e: 'navigate', route: NonNullable<TableRow['globalRoute']>): void
  /** Select a value for a grouped global cookie preset at the given row index. */
  (e: 'selectPreset', index: number, value: string): void
}>()

const columns = computed(() => {
  if (showUploadButton) {
    return ['36px', '', '', 'minmax(0, 1fr)']
  }
  return ['36px', '', '']
})

/** Add the last empty row (for ui purposes only) */
const displayData = computed(() => {
  if (!showAddRowPlaceholder) {
    return data
  }

  const last = data.at(-1)

  if (!last || last.name !== '' || last.value !== '') {
    return [...data, { name: '', value: '', isDisabled: true }]
  }

  return data
})

/**
 * Stable identity key for each row so Vue never reuses a RequestTableRow instance for a different
 * parameter or the appended placeholder row. Parameter rows are keyed by their parameter identity —
 * the name plus the value path for expanded object parameters. The parts are combined through
 * JSON.stringify so the name/path boundary is unambiguous (for example `ab` + `['c']` never
 * collides with `a` + `['bc']`). Rows without a parameter (like the placeholder) fall back to their
 * name, and finally the index, which is only reached for transient empty rows.
 */
const getRowKey = (row: TableRow, index: number): string => {
  if (row.originalParameter) {
    return JSON.stringify([
      row.originalParameter.name,
      ...(row.sourceParameterValuePath ?? []),
    ])
  }

  return row.name || String(index)
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

    <RequestTableRow
      v-for="(row, index) in displayData"
      :key="getRowKey(row, index)"
      :data="row"
      :environment="environment"
      :hasCheckboxDisabled="hasCheckboxDisabled"
      :invalidParams="invalidParams"
      :label="label"
      :showUploadButton="showUploadButton"
      @deleteRow="emit('deleteRow', index)"
      @navigate="(route) => emit('navigate', route)"
      @removeFile="emit('removeFile', index)"
      @selectPreset="(value) => emit('selectPreset', index, value)"
      @uploadFile="emit('uploadFile', index)"
      @upsertRow="(payload) => emit('upsertRow', index, payload)" />
  </DataTable>
</template>
<style scoped>
:deep(.code-input-lite__editor) {
  background-color: transparent;
  font-family: var(--scalar-font);
  font-size: var(--scalar-small);
  padding: 5px 8px;
}
:deep(.scalar-pill:not(:last-of-type)) {
  margin-right: 0.15em;
}
:deep(.scalar-pill:not(:first-of-type)) {
  margin-left: 0.5px;
}
</style>
