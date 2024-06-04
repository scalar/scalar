<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'

defineProps<{
  headers: { name: string; value: string; required: boolean }[]
}>()

// Make the first letter and all letters after a - uppercase
const formatHeaderName = (headerName: string) => {
  return headerName
    .split('-')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('-')
}
</script>
<template>
  <ViewLayoutCollapse
    :defaultOpen="false"
    :itemCount="headers.length">
    <template #title>Headers</template>
    <template v-if="true">
      <DataTable
        v-if="headers.length"
        class="flex-1"
        :columns="['', '']">
        <DataTableRow
          v-for="(item, idx) in headers"
          :key="idx">
          <DataTableInput
            :modelValue="formatHeaderName(item.name)"
            :readOnly="true" />
          <DataTableInput
            :modelValue="item.value"
            :readOnly="true" />
        </DataTableRow>
      </DataTable>
      <!-- Empty state -->
      <div
        v-else
        class="text-c-3 px-4 text-sm border rounded min-h-[47.25px] justify-center flex items-center bg-b-1 mx-1">
        No cookies
      </div>
    </template>
  </ViewLayoutCollapse>
</template>
