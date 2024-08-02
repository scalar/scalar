<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'

type Header = { name: string; value: string; required: boolean }

const props = defineProps<{
  headers: Header[]
}>()

// TODO: This should probably in the sendRequest method
// TODO: Add tests for this
// TODO: Should we add the same logic to the proxy?
/** List of modified headers */
const modifiedHeaders =
  props.headers
    .find((h) => {
      return h.name.toLowerCase() === 'x-scalar-modified-headers'
    })
    ?.value?.split(', ')
    ?.map((value) => value.toLowerCase()) ?? []

/** Headers, but without the modifications from the Electron app */
const normalizedHeaders = props.headers
  // Remove headers listed in `X-Scalar-Modified-Headers`
  .filter((header) => {
    return !modifiedHeaders.includes(header.name.toLowerCase())
  })
  // Remove list of modified headers
  .filter((header) => {
    return header.name.toLowerCase() !== 'x-scalar-modified-headers'
  })
  // Restore original headers (prefixed with `X-Scalar-Original-`)
  .map((header) => {
    const originalHeaderName = header.name
      .toLowerCase()
      .replace('x-scalar-original-', '')

    const originalHeader = props.headers.find((h) => {
      return h.name === originalHeaderName
    })

    if (originalHeader) {
      return {
        name: originalHeader.name,
        value: originalHeader.value,
      }
    }

    return header
  })
  // Remove headers that are prefixed with `X-Scalar-Original-`
  .filter((header) => {
    return !header.name.toLowerCase().startsWith('x-scalar-original-')
  })
  // Sort headers alphebetically by `name`
  .sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

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
    :itemCount="normalizedHeaders.length">
    <template #title>Headers</template>
    <DataTable
      v-if="normalizedHeaders.length"
      :columns="['minmax(auto, min-content)', 'minmax(50%, 1fr)']"
      scroll>
      <DataTableRow
        v-for="(item, idx) in normalizedHeaders"
        :key="idx"
        class="text-c-1">
        <DataTableText
          class="sticky left-0 z-1 bg-b-1 max-w-48"
          :text="formatHeaderName(item.name)" />
        <DataTableText
          class="z-0"
          :text="item.value" />
      </DataTableRow>
    </DataTable>
    <!-- Empty state -->
    <div
      v-else
      class="text-c-3 px-4 text-sm border rounded min-h-12 justify-center flex items-center bg-b-1 mx-1">
      No Headers
    </div>
  </ViewLayoutCollapse>
</template>
