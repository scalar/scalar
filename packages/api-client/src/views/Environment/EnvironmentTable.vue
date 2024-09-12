<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import { ref, watch } from 'vue'

const props = defineProps<{
  items?: { key: string; value: string }[]
}>()

const emit = defineEmits<{
  (e: 'updateRow', idx: number, field: 'key' | 'value', value: string): void
  (e: 'addRow'): void
}>()

const columns = ['', '']
</script>
<template>
  <DataTable
    class="mx-2 xl:mx-5 my-2.5"
    :columns="columns">
    <DataTableRow
      v-for="(item, idx) in items"
      :key="idx">
      <DataTableCell>
        <CodeInput
          disableCloseBrackets
          disableEnter
          disableTabIndent
          :modelValue="item.key"
          placeholder="Key"
          :withVariables="false"
          @input="items && idx === items.length - 1 && emit('addRow')"
          @update:modelValue="
            (v: string) => emit('updateRow', idx, 'key', v)
          " />
      </DataTableCell>
      <DataTableCell>
        <CodeInput
          disableCloseBrackets
          disableEnter
          disableTabIndent
          :modelValue="item.value"
          placeholder="Value"
          :withVariables="false"
          @input="
            props.items && idx === props.items.length - 1 && emit('addRow')
          "
          @update:modelValue="
            (v: string) => emit('updateRow', idx, 'value', v)
          " />
      </DataTableCell>
    </DataTableRow>
  </DataTable>
</template>
<style scoped>
:deep(.cm-editor) {
  padding: 0;
}
:deep(.cm-content) {
  background-color: transparent;
  font-family: var(--scalar-font);
  font-size: var(--scalar-mini);
  padding: 6px 8px;
}
:deep(.cm-content):has(.cm-pill) {
  padding: 4px 8px;
}
:deep(.cm-line) {
  padding: 0;
}
</style>
