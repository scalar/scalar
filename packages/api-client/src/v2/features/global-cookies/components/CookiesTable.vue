<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconTrash } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { computed } from 'vue'

import { CodeInput } from '@/components/CodeInput'
import {
  DataTable,
  DataTableCell,
  DataTableCheckbox,
  DataTableHeader,
  DataTableRow,
} from '@/components/DataTable'
import type { EnvVariable } from '@/store'

type TableRow = {
  name: string
  value: string
  domain: string
  isDisabled?: boolean
}

const { data } = defineProps<{
  data: TableRow[]

  /** TODO: remove once we migrate */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const emits = defineEmits<{
  (e: 'addRow', payload: Partial<TableRow>): void
  (e: 'updateRow', index: number, payload: Partial<TableRow>): void
  (e: 'deleteRow', index: number): void
}>()

/** Add the last empty row (for ui purposes only) */
const displayData = computed(() => {
  const last = data.at(-1)
  if (!last || last.name !== '' || last.value !== '' || last.domain !== '') {
    return [...data, { name: '', value: '', domain: '', isDisabled: true }]
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
  payload: Partial<TableRow>
}) => {
  /** If the update happen on the last row, it means we need to add a new row */
  if (index >= data.length) {
    emits('addRow', payload)
    return
  }
  /** Otherwise we just update the existing row */
  emits('updateRow', index, payload)
}

const columns = ['32px', '1fr', '1fr', '1fr', '36px']
</script>
<template>
  <DataTable
    class="group/table data-table h-min flex-1 rounded border"
    :columns="columns">
    <DataTableRow class="sr-only !block">
      <DataTableHeader>Enabled</DataTableHeader>
      <DataTableHeader>Name</DataTableHeader>
      <DataTableHeader>Value</DataTableHeader>
      <DataTableHeader>Domain</DataTableHeader>
      <DataTableHeader>Actions</DataTableHeader>
    </DataTableRow>
    <DataTableRow
      v-for="(cookie, id) in displayData"
      :id="id"
      :key="id"
      class="group/row">
      <DataTableCheckbox
        class="!border-r"
        :modelValue="!cookie.isDisabled"
        @update:modelValue="
          (value) => updateOrAdd({ index: id, payload: { isDisabled: !value } })
        " />
      <DataTableCell>
        <CodeInput
          aria-label="Cookie Name"
          disableCloseBrackets
          disableTabIndent
          :envVariables="envVariables"
          :environment="environment"
          lineWrapping
          :modelValue="cookie.name"
          placeholder="Name"
          @update:modelValue="
            (value) => updateOrAdd({ index: id, payload: { name: value } })
          " />
      </DataTableCell>
      <DataTableCell>
        <CodeInput
          aria-label="Cookie Value"
          disableTabIndent
          :envVariables="envVariables"
          :environment="environment"
          lineWrapping
          :modelValue="cookie.value"
          placeholder="Value"
          @update:modelValue="
            (value) => updateOrAdd({ index: id, payload: { value: value } })
          ">
        </CodeInput>
      </DataTableCell>
      <DataTableCell>
        <CodeInput
          aria-label="Cookie Domain"
          disableCloseBrackets
          disableTabIndent
          :envVariables="envVariables"
          :environment="environment"
          lineWrapping
          :modelValue="cookie.domain"
          placeholder="Domain"
          @update:modelValue="
            (value) => updateOrAdd({ index: id, payload: { domain: value } })
          " />
      </DataTableCell>
      <DataTableCell class="flex items-center justify-center">
        <ScalarButton
          class="text-c-2 hover:text-c-1 hover:bg-b-2 hidden h-fit rounded p-1 group-hover/row:flex"
          size="sm"
          variant="ghost"
          @click="$emit('deleteRow', id)">
          <ScalarIconTrash class="size-3.5" />
        </ScalarButton>
      </DataTableCell>
    </DataTableRow>
  </DataTable>
</template>
<style scoped>
.data-table tr:nth-child(2) td {
  border-top: none !important;
}
</style>
