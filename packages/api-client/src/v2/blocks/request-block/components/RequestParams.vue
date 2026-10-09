<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarCombobox } from '@scalar/components/combobox'
import { ScalarTooltip } from '@scalar/components/tooltip'
import { ScalarIconPlus } from '@scalar/icons'
import type {
  ApiReferenceEvents,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed, nextTick, ref, useTemplateRef } from 'vue'

import { CollapsibleSection } from '@/v2/components/layout'
import { useLocalization } from '@/v2/features/localization'

import RequestTable from './RequestTable.vue'
import type { TableRow, TableRowUpsertPayload } from './RequestTableRow.vue'

const {
  rows,
  exampleKey,
  environment,
  title,
  globalRoute,
  showAddRowPlaceholder = true,
  eventBus,
  selectExpandedParameters = false,
} = defineProps<{
  rows: TableRow[]
  exampleKey: string
  title: string
  label?: string
  /** Explain restrictions on parameter editing when needed. */
  description?: string
  invalidParams?: Set<string>
  globalRoute?: string
  showAddRowPlaceholder?: boolean
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
  /** Offer empty object query fields on demand without changing the complete editing context. */
  selectExpandedParameters?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'upsert',
    index: number,
    payload: ApiReferenceEvents['operation:upsert:parameter']['payload'] & {
      shouldRenameExpandedRow?: boolean
    },
  ): void
  (e: 'delete', payload: { index: number }): void
  (e: 'deleteAll'): void
  /** Select a value for a grouped global cookie preset at the given row index. */
  (e: 'selectPreset', index: number, value: string): void
}>()

const { translate } = useLocalization()

const showTooltip = computed(() => rows.length > 1)
const table = useTemplateRef('table')
const pickerContainer = useTemplateRef('pickerContainer')
const selectedFields = ref(new Set<string>())

const getFieldKey = (row: TableRow, name = row.name): string =>
  JSON.stringify([row.originalParameter?.in, row.originalParameter?.name, name])

/** Single-field objects and ordinary parameters keep their existing presentation. */
const expandedParameters = computed(() => {
  const counts = new Map<TableRow['originalParameter'], number>()
  for (const row of rows) {
    if (row.originalParameter?.in === 'query' && row.sourceParameterValuePath) {
      counts.set(
        row.originalParameter,
        (counts.get(row.originalParameter) ?? 0) + 1,
      )
    }
  }
  return new Set(
    [...counts]
      .filter(([, count]) => count > 1)
      .map(([parameter]) => parameter),
  )
})

const isSelectable = (row: TableRow): boolean =>
  selectExpandedParameters &&
  Boolean(row.sourceParameterValuePath) &&
  expandedParameters.value.has(row.originalParameter)

/** Keep original indexes: handlers rebuild object values from all rows, including hidden fields. */
const indexedRows = computed(() => rows.map((row, index) => ({ row, index })))
const visibleRows = computed(() =>
  indexedRows.value.filter(
    ({ row }) =>
      !isSelectable(row) ||
      row.isRequired ||
      (row.value !== '' && row.value !== null) ||
      selectedFields.value.has(getFieldKey(row)),
  ),
)
const tableRows = computed(() => visibleRows.value.map(({ row }) => row))
const availableFields = computed(() =>
  indexedRows.value
    .filter(
      (entry) => !visibleRows.value.some(({ index }) => index === entry.index),
    )
    .map(({ row, index }) => ({
      id: getFieldKey(row),
      label: row.name,
      description: row.description,
      index,
    })),
)

const selectField = async (
  option: { id: string; index: number } | undefined,
): Promise<void> => {
  if (!option) return
  selectedFields.value.add(option.id)
  await nextTick()
  table.value?.focusValue(
    visibleRows.value.findIndex(({ index }) => index === option.index),
  )
}

const deleteRow = (index: number): void => {
  const entry = visibleRows.value[index]
  if (entry) selectedFields.value.delete(getFieldKey(entry.row))
  emit('delete', {
    index: entry?.index ?? rows.length + index - visibleRows.value.length,
  })
}

const deleteAll = (): void => {
  selectedFields.value.clear()
  emit('deleteAll')
}

/** Needed for type guard */
const handleUpserRow = (
  index: number,
  payload: TableRowUpsertPayload,
): void => {
  const { value, ...rest } = payload

  // Type guard here as we cannot add files to params
  if (value instanceof File) {
    return
  }

  const entry = visibleRows.value[index]
  if (entry && isSelectable(entry.row)) {
    // Editing a populated field keeps it visible even after its value is cleared.
    selectedFields.value.add(
      getFieldKey(
        entry.row,
        payload.shouldRenameExpandedRow ? payload.name : entry.row.name,
      ),
    )
  }
  emit(
    'upsert',
    entry?.index ?? rows.length + index - visibleRows.value.length,
    { ...rest, value: value ?? '' },
  )
}
</script>
<template>
  <CollapsibleSection
    class="group/params"
    :itemCount="tableRows.length">
    <template #title>{{ title }}</template>
    <template #actions>
      <div
        class="text-c-2 request-meta-buttons flex whitespace-nowrap opacity-0 group-hover/params:opacity-100 has-[:focus-visible]:opacity-100">
        <ScalarTooltip
          v-if="showTooltip"
          :content="
            translate('apiClient.requestParams.clearOptionalParameters')
          "
          placement="left">
          <ScalarButton
            :aria-label="
              translate('apiClient.requestParams.clearAll', { title })
            "
            class="pr-0.75 pl-1 transition-none"
            size="sm"
            variant="ghost"
            @click.stop="deleteAll">
            {{ translate('apiClient.requestParams.clear') }}
          </ScalarButton>
        </ScalarTooltip>
      </div>
    </template>
    <p
      v-if="description"
      class="text-c-2 px-3 py-2 text-sm">
      {{ description }}
    </p>
    <RequestTable
      ref="table"
      class="flex-1"
      :columns="['32px', '', '']"
      :data="tableRows"
      :environment="environment"
      :exampleKey="exampleKey"
      :globalRoute="globalRoute"
      :invalidParams="invalidParams"
      :label="label"
      :showAddRowPlaceholder="showAddRowPlaceholder"
      @deleteRow="deleteRow"
      @navigate="(route) => eventBus.emit('ui:navigate', route)"
      @selectPreset="(index, value) => emit('selectPreset', index, value)"
      @upsertRow="handleUpserRow" />
    <div
      v-if="availableFields.length"
      ref="pickerContainer"
      class="mx-2 border-t py-1">
      <ScalarCombobox
        :inputLabel="translate('apiClient.requestParams.searchParameters')"
        :noResults="translate('apiClient.requestParams.noParametersFound')"
        :options="availableFields"
        :placeholder="translate('apiClient.requestParams.searchParameters')"
        placement="bottom-start"
        resize
        :target="pickerContainer ?? undefined"
        @update:modelValue="selectField">
        <ScalarButton
          class="gap-1.5"
          size="sm"
          variant="ghost">
          <ScalarIconPlus class="size-3.5" />
          {{ translate('apiClient.requestParams.addParameter') }}
        </ScalarButton>
        <template #option="{ option }">
          <span class="min-w-0">
            <span class="block break-all">{{ option.label }}</span>
            <span
              v-if="option.description"
              class="text-c-2 block text-xs"
              >{{ option.description }}</span
            >
          </span>
        </template>
      </ScalarCombobox>
    </div>
  </CollapsibleSection>
</template>
