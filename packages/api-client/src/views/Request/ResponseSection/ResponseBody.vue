<script lang="ts" setup>
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useCodeMirror } from '@scalar/use-codemirror'
import { computed, ref, toRef } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    data: any
    headers: { name: string; value: string; required: boolean }[]
  }>(),
  {
    data: null,
  },
)

const codeLanguage = computed(() => {
  const contentTypeHeader =
    props.headers.find((header) => header.name.toLowerCase() === 'content-type')
      ?.value ?? ''

  if (contentTypeHeader.includes('json')) return 'json'
  if (contentTypeHeader.includes('html')) return 'html'
  return 'html'
})

const codeMirrorRef = ref<HTMLDivElement | null>(null)

useCodeMirror({
  codeMirrorRef,
  readOnly: true,
  lineNumbers: true,
  content: toRef(() => props.data),
  language: codeLanguage,
})
</script>
<template>
  <ViewLayoutCollapse>
    <template #title>{{ title }}</template>
    <DataTable :columns="['']">
      <DataTableRow>
        <div ref="codeMirrorRef" />
      </DataTableRow>
    </DataTable>
  </ViewLayoutCollapse>
</template>
<style scoped>
.force-text-sm {
  --scalar-small: 13px;
}
iframe {
  background-color: transparent;
}
</style>
