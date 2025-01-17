<script setup lang="ts">
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
    <template #title>Headers</template>
    <div
      v-if="headers.length"
      class="border-t-1/2 border-b-1/2 max-h-[calc(100%-32px)] overflow-y-auto">
      <DataTable
        class="!border-0 !mx-0"
        :columns="['minmax(auto, min-content)', 'minmax(50%, 1fr)']"
        scroll>
        <DataTableRow
          v-for="item in headers"
          :key="item.name"
          class="text-c-1">
          <DataTableText class="sticky left-0 z-1 bg-b-1 max-w-48">
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
            class="z-0"
            :text="item.value" />
        </DataTableRow>
      </DataTable>
    </div>
    <!-- Empty state -->
    <div
      v-else
      class="text-c-3 px-4 text-sm border rounded min-h-12 justify-center flex items-center bg-b-1">
      No Headers
    </div>
  </ViewLayoutCollapse>
</template>
