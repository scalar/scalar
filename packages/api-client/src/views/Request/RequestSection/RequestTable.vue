<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import { hasItemProperties } from '../libs/request'
import RequestTableTooltip from './RequestTableTooltip.vue'

const props = withDefaults(
  defineProps<{
    items?: RequestExampleParameter[]
    /** Disable the checkbox */
    hasCheckboxDisabled?: boolean
    showUploadButton?: boolean
    global?: boolean
  }>(),
  { hasCheckboxDisabled: false, showUploadButton: false, global: false },
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

const columns = ['', '', '36px']

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

const flattenValue = (item: RequestExampleParameter) => {
  return Array.isArray(item.default) && item.default.length === 1
    ? item.default[0]
    : item.default
}

const isReadOnly = computed(() => {
  return props.global
})
</script>
<template>
  <DataTable
    class="flex-1"
    :columns="columns">
    <DataTableRow
      v-for="(item, idx) in items"
      :key="item.key">
      <label class="contents">
        <template v-if="isReadOnly">
          <span class="sr-only">Global</span>
          <div class="flex-center">
            <!-- TODO: Add a tooltip -->
            <!-- TODO: Make fields read-only -->
            <ScalarIcon
              icon="Globe"
              size="xs" />
          </div>
        </template>
        <template v-else>
          <span class="sr-only">Row Enabled</span>
          <DataTableCheckbox
            class="!border-r-1/2"
            :disabled="hasCheckboxDisabled"
            :modelValue="item.enabled"
            @update:modelValue="(v) => emit('toggleRow', idx, v)" />
        </template>
      </label>
      <DataTableCell>
        <CodeInput
          disableCloseBrackets
          disableEnter
          disableTabIndent
          :modelValue="item.key"
          placeholder="Key"
          :required="item.required"
          @blur="emit('inputBlur')"
          @focus="emit('inputFocus')"
          @selectVariable="(v: string) => handleSelectVariable(idx, 'key', v)"
          @update:modelValue="
            (v: string) => emit('updateRow', idx, 'key', v)
          " />
      </DataTableCell>
      <DataTableCell>
        <CodeInput
          :class="{
            'pr-6': hasItemProperties(item),
          }"
          :default="item.default"
          disableCloseBrackets
          disableEnter
          disableTabIndent
          :enum="item.enum"
          :max="item.maximum"
          :min="item.minimum"
          :modelValue="item.value"
          :nullable="item.nullable"
          placeholder="Value"
          :type="item.type"
          @blur="emit('inputBlur')"
          @focus="emit('inputFocus')"
          @selectVariable="(v: string) => handleSelectVariable(idx, 'value', v)"
          @update:modelValue="
            (v: string) => emit('updateRow', idx, 'value', v)
          ">
          <template
            v-if="valueOutOfRange(item).value"
            #warning>
            {{ valueOutOfRange(item).value }}
          </template>
          <template #icon>
            <RequestTableTooltip
              v-if="hasItemProperties(item)"
              :item="{ ...item, default: flattenValue(item) }" />
          </template>
        </CodeInput>
      </DataTableCell>
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
            class="bg-b-2 hover:bg-b-3 border-0 py-px text-c-2 shadow-none"
            size="sm"
            variant="outlined"
            @click="handleFileUpload(idx)">
            <span>File</span>
            <ScalarIcon
              class="ml-1"
              icon="UploadSimple"
              size="xs"
              thickness="2.5" />
          </ScalarButton>
        </template>
      </DataTableCell>
    </DataTableRow>
  </DataTable>
</template>
<style scoped>
:deep(.cm-editor) {
  padding: 0;
}
:deep(.cm-content) {
  align-items: center;
  background-color: transparent;
  display: flex;
  font-family: var(--scalar-font);
  font-size: var(--scalar-mini);
  padding: 6px 8px;
}
:deep(.cm-content):has(.cm-pill) {
  padding: 4px 3px;
}
:deep(.cm-content .cm-pill:not(:last-of-type)) {
  margin-right: 0.5px;
}
:deep(.cm-content .cm-pill:not(:first-of-type)) {
  margin-left: 0.5px;
}
:deep(.cm-line) {
  padding: 0;
}
.filemask {
  mask-image: linear-gradient(
    to right,
    transparent 0,
    var(--scalar-background-2) 20px
  );
}
</style>
