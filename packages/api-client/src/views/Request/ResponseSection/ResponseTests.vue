<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import type { ResponseTest } from '@scalar/oas-utils/entities/workspace/spec'

defineProps<{
  tests?: ResponseTest[]
}>()
</script>
<template>
  <ViewLayoutCollapse>
    <template #title>Tests</template>
    <template v-if="true">
      <DataTable
        v-if="tests?.length"
        class="flex-1"
        :columns="['', '']">
        <DataTableRow>
          <DataTableHeader>Title</DataTableHeader>
          <DataTableHeader>Status</DataTableHeader>
        </DataTableRow>
        <DataTableRow
          v-for="(item, idx) in tests"
          :key="idx">
          <DataTableText :text="item.title" />
          <DataTableText :text="item.passed ? 'Success' : 'Failed'" />
        </DataTableRow>
      </DataTable>
      <!-- Empty state -->
      <div
        v-else
        class="text-c-3 px-4 text-sm border border-1/2 rounded min-h-12 justify-center flex items-center bg-b-1 mx-1">
        No cookies
      </div>
    </template>
  </ViewLayoutCollapse>
</template>
