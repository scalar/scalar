<script setup lang="ts">
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed } from 'vue'

import RequestTableRow, {
  type TableRow,
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
  (
    e: 'upsertRow',
    index: number,
    payload: {
      name: string
      value: string | File | undefined
      isDisabled: boolean
    },
  ): void
  (e: 'deleteRow', index: number): void

  /**
   * File upload events
   *
   * Each row has its own upload button, so we need to know which row to update
   * when the file is selected.
   */
  (e: 'uploadFile', index: number): void
  (e: 'removeFile', index: number): void
  (e: 'navigate', route: string): void
}>()

const columns = computed(() => {
  if (showUploadButton) {
    return ['36px', '', '', 'auto']
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
      :key="index"
      :data="row"
      :environment="environment"
      :hasCheckboxDisabled="hasCheckboxDisabled"
      :invalidParams="invalidParams"
      :label="label"
      :showUploadButton="showUploadButton"
      @deleteRow="emit('deleteRow', index)"
      @navigate="(route) => emit('navigate', route)"
      @removeFile="emit('removeFile', index)"
      @uploadFile="emit('uploadFile', index)"
      @upsertRow="(payload) => emit('upsertRow', index, payload)" />
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
