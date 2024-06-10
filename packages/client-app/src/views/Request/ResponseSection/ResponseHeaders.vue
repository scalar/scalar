<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
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
          <DataTableText :text="formatHeaderName(item.name)" />
          <DataTableText :text="item.value" />
        </DataTableRow>
      </DataTable>
      <!-- Empty state -->
      <div
        v-else
        class="text-c-3 px-4 text-sm border rounded min-h-12 justify-center flex items-center bg-b-1 mx-1">
        No Headers
      </div>
    </template>
  </ViewLayoutCollapse>
</template>
