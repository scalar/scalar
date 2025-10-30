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

const { environment, environmentName, eventBus, type } = defineProps<
  {
    environment: XScalarEnvironment
    environmentName: string
    eventBus: WorkspaceEventBus
  } & CollectionType
>()

/**
 * Represents a single row in the environment variables table.
 */
type VariableRow = {
  name: string
  value: string
}

/** Column widths: Name, Value, Actions (delete button) */
const COLUMNS = ['1fr', '1fr', '36px']

/** Adds an empty row at the end for creating new variables */
const displayRows = computed<VariableRow[]>(() => {
  /** Normalize the variables to have a name and value */
  const variableRows = environment.variables.map((v) => ({
    name: v.name,
    value: typeof v.value === 'string' ? v.value : v.value.default,
  }))

  const lastRow = environment.variables.at(-1)
  const hasContentInLastRow =
    lastRow && (lastRow.name !== '' || lastRow.value !== '')

  // Add the extra row at the end
  if (!lastRow || hasContentInLastRow) {
    return [...variableRows, { name: '', value: '' }]
  }

  return variableRows
})

/** Updates an existing variable or creates a new one */
const handleVariableChange = (
  name: string,
  value: string,
  index: number,
): void => {
  const isNewVariable = index >= environment.variables.length

  /**
   * Do not allow adding a new variable with an empty name on the last row,
   * we allow it on other rows as it will delete the row
   */
  if (!name && isNewVariable) {
    return
  }

  // Adding a new variable
  if (index >= environment.variables.length) {
    eventBus.emit('environment:upsert:environment-variable', {
      environmentName,
      variable: { name, value },
      type,
    })
    return
  }

  // Updating
  eventBus.emit('environment:upsert:environment-variable', {
    environmentName,
    variable: { name, value },
    index,
    type,
  })
}

/** Deletes a variable by index */
const handleVariableDelete = (index: number): void =>
  eventBus.emit('environment:delete:environment-variable', {
    environmentName,
    index,
    type,
  })
</script>
<template>
  <!-- Environment variables table -->
  <DataTable
    class="group/table data-table h-min flex-1 rounded border"
    :columns="COLUMNS">
    <!-- Accessibility header row -->
    <DataTableRow class="sr-only !block">
      <DataTableHeader>Name</DataTableHeader>
      <DataTableHeader>Value</DataTableHeader>
      <DataTableHeader>Actions</DataTableHeader>
    </DataTableRow>

    <!-- Variable rows -->
    <DataTableRow
      v-for="(row, index) in displayRows"
      :key="index"
      class="group/row">
      <!-- Name -->
      <DataTableCell>
        <CodeInput
          aria-label="Environment Variable Name"
          disableCloseBrackets
          disableTabIndent
          :environment="environment"
          lineWrapping
          :modelValue="row.name"
          placeholder="Name"
          @update:modelValue="
            (name) => handleVariableChange(name, row.value, index)
          " />
      </DataTableCell>

      <!-- Value -->
      <DataTableCell>
        <CodeInput
          aria-label="Environment Variable Value"
          disableTabIndent
          :environment="environment"
          lineWrapping
          :modelValue="row.value"
          placeholder="Value"
          @update:modelValue="
            (value) => handleVariableChange(row.name, value, index)
          " />
      </DataTableCell>

      <!-- Delete button -->
      <DataTableCell class="flex items-center justify-center">
        <ScalarButton
          v-if="index < environment.variables.length"
          class="text-c-2 hover:text-c-1 hover:bg-b-2 hidden h-fit rounded p-1 group-focus-within:flex group-hover/row:flex"
          size="sm"
          variant="ghost"
          @click="handleVariableDelete(index)">
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
