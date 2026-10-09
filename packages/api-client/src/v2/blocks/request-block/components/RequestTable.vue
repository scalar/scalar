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
import { useLocalization } from '@/v2/features/localization'

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

const { translate } = useLocalization()

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
const getRowKey = (row: TableRow, index: number): string => {
  // Body edits retain their row when blur commits a rename after focus moves into the value.
  if (deferKeyUpdates) {
    return `body:${index}`
  }
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

/** Keep an edited row mounted when saving it changes its parameter identity. */
type DisplayRow = {
  data: TableRow
  identity: string
  key: symbol
}

const pendingUpdates = new Map<symbol, TableRowUpsertPayload>()

const matchesPendingUpdate = (key: symbol, row: TableRow): boolean => {
  const update = pendingUpdates.get(key)
  return update?.name === row.name && update.value === row.value
}

// A saved parameter inherits the editor's key. The next placeholder gets a fresh key,
// so it cannot retain the previous placeholder's text or focused input.
const keyedRows = computed<DisplayRow[]>((previous = []) => {
  const available = new Set(previous)
  // Reserve identities still present in the store before transferring an edited key.
  // The appended placeholder is excluded so a newly saved row can inherit its editor.
  const savedIdentities = new Set(data.map(getRowKey))
  const rows = displayData.value.map((row, index) => {
    const identity = getRowKey(row, index)
    const existing = [...available].find((entry) => entry.identity === identity)
    const pending = [...available].find(
      (entry) =>
        !savedIdentities.has(entry.identity) &&
        !entry.data.sourceParameterValuePath &&
        matchesPendingUpdate(entry.key, row),
    )
    const match = existing ?? pending

    if (match) {
      available.delete(match)
      if (matchesPendingUpdate(match.key, row)) {
        pendingUpdates.delete(match.key)
      }
    }

    return { data: row, identity, key: match?.key ?? Symbol() }
  })

  for (const removed of available) {
    pendingUpdates.delete(removed.key)
  }

  return rows
})

const handleUpsertRow = (
  row: DisplayRow,
  index: number,
  payload: TableRowUpsertPayload,
): void => {
  // The store may debounce the save. Transfer this key only when the saved row arrives.
  pendingUpdates.set(row.key, payload)
  emit('upsertRow', index, payload)
}
</script>
<template>
  <DataTable
    class="group/table flex-1"
    :columns="columns">
    <DataTableRow class="sr-only !block">
      <DataTableHeader>
        {{ label }}
        {{ translate('apiClient.requestTable.enabled') }}
      </DataTableHeader>
      <DataTableHeader>
        {{ label }}
        {{ translate('apiClient.requestTable.key') }}
      </DataTableHeader>
      <DataTableHeader>
        {{ label }}
        {{ translate('apiClient.requestTable.value') }}
      </DataTableHeader>
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
      @upsertRow="(payload) => handleUpsertRow(row, index, payload)" />
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
