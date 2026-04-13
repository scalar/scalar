<script setup lang="ts">
import { DataTableHeader } from '@/components/DataTable'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import { CollapsibleSection } from '@/v2/components/layout'

defineProps<{
  cookies: { name: string; value: string }[]
}>()
</script>
<template>
  <CollapsibleSection
    class="overflow-auto"
    :defaultOpen="false"
    :itemCount="cookies.length">
    <template #title>Cookies</template>
    <div
      v-if="cookies.length"
      class="max-h-[calc(100%-32px)] overflow-y-auto">
      <DataTable
        :columns="['minmax(auto, min-content)', 'minmax(50%, 1fr)']"
        scroll>
        <DataTableRow class="sr-only !block">
          <DataTableHeader>Cookie Name</DataTableHeader>
          <DataTableHeader>Cookie Value</DataTableHeader>
        </DataTableRow>
        <DataTableRow
          v-for="(item, index) in cookies"
          :key="item.name"
          class="group/row text-c-1">
          <DataTableText
            class="bg-b-1 sticky left-0 z-1 max-w-full"
            :class="{ 'border-t-0': index === 0 }"
            :text="item.name" />
          <DataTableText
            class="z-0"
            :class="{ 'border-t-0': index === 0 }"
            :text="item.value" />
        </DataTableRow>
      </DataTable>
    </div>
    <!-- Empty state -->
    <div
      v-else
      class="text-c-3 bg-b-1 flex min-h-[64px] items-center justify-center border-t px-4 text-sm">
      No cookies
    </div>
  </CollapsibleSection>
</template>
