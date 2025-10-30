<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconTrash } from '@scalar/icons'
import type {
  CollectionType,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed } from 'vue'

import { CodeInput } from '@/v2/components/code-input'
import {
  DataTable,
  DataTableCell,
  DataTableHeader,
  DataTableRow,
} from '@/v2/components/data-table'

const { environment, eventBus, type } = defineProps<
  {
    environment: XScalarEnvironment
    environmentName: string
    eventBus: WorkspaceEventBus
  } & CollectionType
>()

/** Map the variables to table rows */
const variableRows = computed(() =>
  Object.entries(environment.variables ?? {}).map(([name, value]) => ({
    name,
    value: typeof value === 'string' ? value : value.default,
  })),
)

/** Add the last empty row (for ui purposes only) */
const displayData = computed(() => {
  const last = variableRows.value.at(-1)
  if (!last || last.name !== '' || last.value !== '') {
    return [
      ...variableRows.value,
      { name: '', value: '', domain: '', isDisabled: true },
    ]
  }

  return variableRows.value
})

/**
 * Detect if the incoming event is an add or update and re-emit the event
 */
const updateOrAdd = ({
  index,
  payload,
}: {
  index: number
  payload: Partial<TableRow>
}) => {
  /** If the update happen on the last row, it means we need to add a new row */
  if (index >= variableRows.value.length) {
    eventBus.emit('environment:upsert:environment-variable', {
      environmentName,
      variableName: payload.name,
      payload,
      type,
    })
    return
  }
  /** Otherwise we just update the existing row */
  emit('updateRow', index, payload)
}

const columns = ['1fr', '1fr', '36px']
</script>
<template>
  <DataTable
    class="group/table data-table h-min flex-1 rounded border"
    :columns="columns">
    <DataTableRow class="sr-only !block">
      <DataTableHeader>Name</DataTableHeader>
      <DataTableHeader>Value</DataTableHeader>
      <DataTableHeader>Actions</DataTableHeader>
    </DataTableRow>
    <DataTableRow
      v-for="(row, id) in displayData"
      :id="id"
      :key="id"
      class="group/row">
      <DataTableCell>
        <CodeInput
          aria-label="Cookie Name"
          disableCloseBrackets
          disableTabIndent
          :environment="environment"
          lineWrapping
          :modelValue="row.name"
          placeholder="Name"
          @update:modelValue="
            (value) => updateOrAdd({ index: id, payload: { name: value } })
          " />
      </DataTableCell>
      <DataTableCell>
        <CodeInput
          aria-label="Cookie Value"
          disableTabIndent
          :environment="environment"
          lineWrapping
          :modelValue="row.value"
          placeholder="Value"
          @update:modelValue="
            (value) => updateOrAdd({ index: id, payload: { value: value } })
          ">
        </CodeInput>
      </DataTableCell>
      <DataTableCell class="flex items-center justify-center">
        <ScalarButton
          class="text-c-2 hover:text-c-1 hover:bg-b-2 hidden h-fit rounded p-1 group-focus-within:flex group-hover/row:flex"
          size="sm"
          variant="ghost"
          @click="
            eventBus.emit('environment:delete:environment-variable', {
              environmentName,
              variableName: row.name,
              type,
            })
          ">
          <ScalarIconTrash class="size-3.5" />
        </ScalarButton>
      </DataTableCell>
    </DataTableRow>
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
.data-table tr:nth-child(2) td {
  border-top: none !important;
}
</style>
