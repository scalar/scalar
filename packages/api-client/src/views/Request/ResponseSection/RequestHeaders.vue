<script setup lang="ts">
import { DataTableHeader } from '@/components/DataTable'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import HelpfulLink from '@/components/HelpfulLink.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { httpHeaders } from '@/data/httpHeaders'

type Header = { name: string; value: string; required: boolean }

defineProps<{
  headers: Header[]
}>()

const findHeaderInfo = (name: string) => {
  return httpHeaders.find(
    (header) => header.name.toLowerCase() === name.toLowerCase(),
  )
}
</script>
<template>
  <ViewLayoutCollapse
    class="overflow-auto"
    :defaultOpen="false"
    :itemCount="headers.length">
    <template #title>Request Headers</template>
    <div
      v-if="headers.length"
      class="max-h-[calc(100%-32px)] overflow-y-auto">
      <DataTable
        :columns="['minmax(auto, min-content)', 'minmax(50%, 1fr)']"
        scroll>
        <DataTableRow class="sr-only !block">
          <DataTableHeader>Header Key</DataTableHeader>
          <DataTableHeader>Header Value</DataTableHeader>
        </DataTableRow>
        <DataTableRow
          v-for="item in headers"
          :key="item.name"
          class="group/row text-c-1">
          <DataTableText
            class="bg-b-1 sticky left-0 z-1 max-w-48 group-first/row:border-t-0">
            <template v-if="typeof findHeaderInfo(item.name)?.url === 'string'">
              <HelpfulLink
                class="decoration-c-3"
                :href="findHeaderInfo(item.name)!.url">
                {{ item.name }}
              </HelpfulLink>
            </template>
            <template v-else>
              {{ item.name }}
            </template>
          </DataTableText>
          <DataTableText
            class="z-0 group-first/row:border-t-0"
            :text="item.value" />
        </DataTableRow>
      </DataTable>
    </div>
    <!-- Empty state -->
    <div
      v-else
      class="text-c-3 bg-b-1 flex min-h-12 items-center justify-center rounded border px-4 text-base">
      No Headers
    </div>
  </ViewLayoutCollapse>
</template>
