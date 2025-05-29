<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'

defineProps<{
  cookies: { name: string; value: string; required: boolean }[]
}>()
</script>
<template>
  <ViewLayoutCollapse :defaultOpen="false">
    <template #title>Cookies</template>
    <template v-if="true">
      <DataTable
        v-if="cookies.length"
        class="flex-1"
        :columns="['', '']">
        <DataTableRow
          v-for="item in cookies"
          :key="item.name">
          <DataTableText :text="item.name" />
          <DataTableText :text="item.value" />
        </DataTableRow>
      </DataTable>
      <!-- Empty state -->
      <div
        v-else
        class="text-c-3 bg-b-1 flex min-h-[65px] items-center justify-center border-t px-4 text-sm">
        No cookies
      </div>
    </template>
  </ViewLayoutCollapse>
</template>
