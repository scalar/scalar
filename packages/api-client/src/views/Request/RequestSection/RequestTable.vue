<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/workspace/spec'
import { computed } from 'vue'

import RequestTableTooltip from './RequestTableTooltip.vue'

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

const showTooltip = (item: RequestExampleParameter) => {
  return !!(item.description || item.type || item.default || item.format)
}

const valueOutOfRange = (item: RequestExampleParameter) => {
  return computed(() => {
    if (item.type === 'integer' && item.value !== undefined) {
      const value = Number(item.value)
      if (item.minimum !== undefined && value < item.minimum) {
        return `Min is ${item.minimum}`
      }
      if (item.maximum !== undefined && value > item.maximum) {
        return `Max is ${item.maximum}`
      }
    }
    return false
  })
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
        :required="item.required"
        @blur="emit('inputBlur')"
        @focus="emit('inputFocus')"
        @input="items && idx === items.length - 1 && emit('addRow')"
        @selectVariable="(v) => handleSelectVariable(idx, 'key', v)"
        @update:modelValue="(v) => emit('updateRow', idx, 'key', v)" />
      <DataTableInput
        :enum="item.enum"
        :max="item.maximum"
        :min="item.minimum"
        :modelValue="item.value"
        placeholder="Value"
        :type="item.type === 'integer' ? 'number' : 'text'"
        @blur="emit('inputBlur')"
        @focus="emit('inputFocus')"
        @input="items && idx === items.length - 1 && emit('addRow')"
        @selectVariable="(v) => handleSelectVariable(idx, 'value', v)"
        @update:modelValue="(v) => emit('updateRow', idx, 'value', v)">
        <template
          v-if="valueOutOfRange(item).value"
          #warning>
          {{ valueOutOfRange(item).value }}
        </template>
        <template #icon>
          <RequestTableTooltip
            v-if="showTooltip(item)"
            :item="item" />
        </template>
      </DataTableInput>
      <DataTableCell
        v-if="showUploadButton"
        class="group/upload p-1 overflow-hidden relative text-ellipsis whitespace-nowrap">
        <template v-if="item.file">
          <div
            class="text-c-2 max-w-[100%] overflow-hidden filemask flex items-end justify-end">
            <span>{{ item.file?.name }}</span>
          </div>
          <button
            class="absolute bg-b-2 font-medium centered-x centered-y hidden rounded text-center p-0.5 w-[calc(100%_-_8px)] group-hover/upload:block text-xs"
            type="button"
            @click="emit('removeFile', idx)">
            Delete
          </button>
        </template>
        <template v-else>
          <ScalarButton
            class="bg-b-2 hover:bg-b-3 border-0 py-px text-c-2"
            size="sm"
            variant="outlined"
            @click="handleFileUpload(idx)">
            <span>File</span>
            <ScalarIcon
              class="ml-1 stroke-[2.5]"
              icon="UploadSimple"
              size="xs" />
          </ScalarButton>
        </template>
      </DataTableCell>
    </DataTableRow>
  </DataTable>
</template>
<style>
/* Input number arrows hidden */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}
</style>
<style scoped>
.filemask {
  mask-image: linear-gradient(
    to right,
    transparent 0,
    var(--scalar-background-2) 20px
  );
}
</style>
