<script setup lang="ts">
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { nanoid } from 'nanoid'
import { computed, shallowRef } from 'vue'

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
  deferKeyUpdates,
  showUploadButton,
  showAddRowPlaceholder = true,
  environment,
} = defineProps<{
  data: TableRow[]
  /** Save key edits on blur so changing a body name does not replace the focused row. */
  deferKeyUpdates?: boolean
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
 * collides with `a` + `['bc']`). Form rows use the name and its occurrence so repeated
 * multipart fields remain distinct while unrelated rows can move without losing their identity.
 */
const getRowIdentity = (row: TableRow, index: number): string => {
  if (row.originalParameter) {
    return JSON.stringify([
      row.originalParameter.name,
      ...(row.sourceParameterValuePath ?? []),
    ])
  }

  const occurrence = displayData.value
    .slice(0, index)
    .filter(
      (other) => !other.originalParameter && other.name === row.name,
    ).length
  return `row:${JSON.stringify([row.name, occurrence])}`
}

type KeyedRow = { data: TableRow; identity: string; key: string }

/**
 * Retain the latest placeholder edit across unrelated refreshes. Once its key moves to a saved
 * row, the empty-name-and-value check below prevents it from being reused for another row.
 */
const pendingRow = shallowRef<{ name: string; key: string }>()

/** Keep the edited placeholder mounted when it becomes a saved row, preserving focus and local edits. */
const keyedRows = computed<KeyedRow[]>((previousRows = []) => {
  const previous = new Map(previousRows.map((row) => [row.identity, row]))
  const placeholder = previousRows.find(
    (row) =>
      row.key === pendingRow.value?.key &&
      row.data.name === '' &&
      row.data.value === '',
  )

  return displayData.value.map((row, index) => {
    const identity = getRowIdentity(row, index)
    const existing = previous.get(identity)
    if (existing) {
      return { data: row, identity, key: existing.key }
    }

    if (placeholder && row.name === pendingRow.value?.name) {
      // The next empty row must get a fresh editor instead of retaining the submitted key.
      previous.delete(placeholder.identity)
      return { data: row, identity, key: placeholder.key }
    }

    return { data: row, identity, key: nanoid() }
  })
})

const handleUpsertRow = (
  index: number,
  payload: TableRowUpsertPayload,
): void => {
  const row = keyedRows.value[index]
  if (row && index >= data.length) {
    pendingRow.value = { name: payload.name, key: row.key }
  }
  emit('upsertRow', index, payload)
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
      v-for="(row, index) in keyedRows"
      :key="row.key"
      :data="row.data"
      :deferKeyUpdates="deferKeyUpdates"
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
      @upsertRow="(payload) => handleUpsertRow(index, payload)" />
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
