<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { RequestInstanceParameter } from '@scalar/oas-utils/entities/workspace/spec'

const props = withDefaults(
  defineProps<{
    items?: RequestInstanceParameter[]
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
      <DataTableInput
        :modelValue="item.value"
        placeholder="Value"
        :required="item.required"
        @blur="emit('inputBlur')"
        @focus="emit('inputFocus')"
        @input="items && idx === items.length - 1 && emit('addRow')"
        @selectVariable="(v) => handleSelectVariable(idx, 'value', v)"
        @update:modelValue="(v) => emit('updateRow', idx, 'value', v)" />
      <div
        v-if="showUploadButton"
        class="p-1">
        <template v-if="item.binary?.file">
          <span class="text-c-2">{{ item.binary?.file.name }}</span>
          <button
            type="button"
            @click="emit('removeFile', idx)">
            remove
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
      </div>
    </DataTableRow>
  </DataTable>
</template>
