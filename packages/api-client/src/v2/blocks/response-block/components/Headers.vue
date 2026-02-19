<script setup lang="ts">
import {
  httpHeaders,
  type HttpHeader,
} from '@scalar/helpers/consts/http-headers'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableText,
} from '@v2/components/data-table'
import { CollapsibleSection } from '@v2/components/layout'

import HelpfulLink from '@/components/HelpfulLink.vue'

type Header = { name: string; value: string }

defineProps<{
  headers: Header[]
}>()

const findHeaderInfo = (name: string): HttpHeader | undefined =>
  httpHeaders[name.toLowerCase() as keyof typeof httpHeaders]
</script>
<template>
  <CollapsibleSection
    class="overflow-auto"
    :defaultOpen="false"
    :itemCount="headers.length">
    <template #title><slot name="title" /></template>
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
            class="bg-b-1 sticky left-0 z-1 max-w-full group-first/row:border-t-0">
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
      class="text-c-3 bg-b-1 flex min-h-[64px] items-center justify-center border-t px-4 text-sm">
      No headers
    </div>
  </CollapsibleSection>
</template>
