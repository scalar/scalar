<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/workspace/spec'

const props = withDefaults(
  defineProps<{
    items?: RequestExampleParameter[]
    /** Hide the enabled column */
    isEnabledHidden?: boolean
    showUploadButton?: boolean
  }>(),
  { isEnabledHidden: false, showUploadButton: false },
)

const emit = defineEmits<{
  (e: 'updateRow', idx: number, field: 'key' | 'value', value: string): void
  (e: 'toggleRow', idx: number, enabled: boolean): void
  (e: 'addRow'): void
  (e: 'deleteRow'): void
  (e: 'inputFocus'): void
  (e: 'inputBlur'): void
  (e: 'uploadFile', idx: number): void
  (e: 'removeFile', idx: number): void
}>()

const columns = props.isEnabledHidden ? ['', ''] : ['', '', '36px']

const handleSelectVariable = (
  idx: number,
  field: 'key' | 'value',
  value: string,
) => {
  emit('updateRow', idx, field, value)
}

const handleFileUpload = (idx: number) => {
  emit('uploadFile', idx)
}
</script>
<template>
  <DataTable
    class="flex-1"
    :columns="columns">
    <DataTableRow
      v-for="(item, idx) in items"
      :key="idx">
      <DataTableCheckbox
        v-if="!isEnabledHidden"
        :modelValue="item.enabled"
        @update:modelValue="(v) => emit('toggleRow', idx, v)" />
      <DataTableInput
        :modelValue="item.key"
        placeholder="Key"
        @blur="emit('inputBlur')"
        @focus="emit('inputFocus')"
        @input="items && idx === items.length - 1 && emit('addRow')"
        @selectVariable="(v) => handleSelectVariable(idx, 'key', v)"
        @update:modelValue="(v) => emit('updateRow', idx, 'key', v)" />

      <!-- todo grab required from the ref -->
      <!-- :required="item.required" -->
      <div class="flex">
        <DataTableInput
          :modelValue="item.value"
          placeholder="Value"
          @blur="emit('inputBlur')"
          @focus="emit('inputFocus')"
          @input="items && idx === items.length - 1 && emit('addRow')"
          @selectVariable="(v) => handleSelectVariable(idx, 'value', v)"
          @update:modelValue="(v) => emit('updateRow', idx, 'value', v)" />
        <span v-if="item.description">{{ item.description }}</span>
      </div>
      <DataTableCell
        v-if="showUploadButton"
        class="group/upload p-1 overflow-hidden relative text-ellipsis whitespace-nowrap">
        <template v-if="item.file">
          <span class="text-c-2">{{ item.file?.name }}</span>
          <button
            class="absolute backdrop-blur-sm border centered-x centered-y hidden rounded text-center p-0.5 w-[calc(100%_-_8px)] group-hover/upload:block"
            type="button"
            @click="emit('removeFile', idx)">
            Remove
          </button>
        </template>
        <template v-else>
          <ScalarButton
            class="w-full"
            size="sm"
            variant="outlined"
            @click="handleFileUpload(idx)">
            <span>Upload File</span>
            <ScalarIcon
              class="ml-1"
              icon="Upload"
              size="xs" />
          </ScalarButton>
        </template>
      </DataTableCell>
    </DataTableRow>
  </DataTable>
</template>
