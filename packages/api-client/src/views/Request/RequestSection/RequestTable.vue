<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarTooltip } from '@scalar/components'
import { ScalarIconTrash } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import type { EnvVariable } from '@/store/active-entities'

import { hasItemProperties, parameterIsInvalid } from '../libs/request'
import RequestTableTooltip from './RequestTableTooltip.vue'

const props = withDefaults(
  defineProps<{
    items?: (RequestExampleParameter & { route?: RouteLocationRaw })[]
    /** Hide the enabled column */
    hasCheckboxDisabled?: boolean
    showUploadButton?: boolean
    isGlobal?: boolean
    isReadOnly?: boolean
    environment: Environment
    envVariables: EnvVariable[]
    workspace: Workspace
    invalidParams?: Set<string>
    label?: string
  }>(),
  {
    hasCheckboxDisabled: false,
    showUploadButton: false,
    isGlobal: false,
    isReadOnly: false,
  },
)

const emit = defineEmits<{
  (e: 'updateRow', idx: number, field: 'key' | 'value', value: string): void
  (e: 'toggleRow', idx: number, enabled: boolean): void
  (e: 'addRow'): void
  (e: 'deleteRow', idx: number): void
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

const flattenValue = (item: RequestExampleParameter) => {
  return Array.isArray(item.default) && item.default.length === 1
    ? item.default[0]
    : item.default
}

// Shows delete button if the item has key or value filled
const showDeleteButton = (item: RequestExampleParameter) => {
  return Boolean(item.key || item.value)
}
</script>
<template>
  <DataTable
    class="group/table flex-1"
    :columns="columns">
    <DataTableRow class="sr-only !block">
      <DataTableHeader>{{ label }} Enabled</DataTableHeader>
      <DataTableHeader>{{ label }} Key</DataTableHeader>
      <DataTableHeader>{{ label }} Value</DataTableHeader>
    </DataTableRow>
    <DataTableRow
      v-for="(item, idx) in items"
      :id="item.key"
      :key="idx"
      :class="{
        alert: parameterIsInvalid(item).value,
        error: invalidParams && invalidParams.has(item.key),
      }">
      <template v-if="isGlobal">
        <RouterLink
          class="text-c-2 flex items-center justify-center border-t !border-r"
          :to="item.route ?? {}">
          <span class="sr-only">Global</span>
          <ScalarTooltip
            content="Global cookies are shared across the whole workspace."
            placement="top">
            <ScalarIcon
              tabindex="0"
              class="text-c-1"
              icon="Globe"
              size="xs" />
          </ScalarTooltip>
        </RouterLink>
      </template>
      <template v-else>
        <DataTableCheckbox
          class="!border-r"
          :disabled="props.hasCheckboxDisabled"
          :modelValue="item.enabled"
          @update:modelValue="(v) => emit('toggleRow', idx, v)" />
      </template>
      <DataTableCell>
        <CodeInput
          :aria-label="`${label} Key`"
          disableCloseBrackets
          :disabled="props.isReadOnly"
          disableEnter
          disableTabIndent
          lineWrapping
          :envVariables="envVariables"
          :environment="environment"
          :modelValue="item.key"
          placeholder="Key"
          :required="Boolean(item.required)"
          :workspace="workspace"
          @blur="emit('inputBlur')"
          @focus="emit('inputFocus')"
          @selectVariable="(v: string) => handleSelectVariable(idx, 'key', v)"
          @update:modelValue="
            (v: string) => emit('updateRow', idx, 'key', v)
          " />
      </DataTableCell>
      <DataTableCell>
        <CodeInput
          :aria-label="`${label} Value`"
          :class="
            hasItemProperties(item)
              ? 'pr-6 group-hover:pr-10 group-has-[.cm-focused]:pr-10'
              : 'group-hover:pr-6 group-has-[.cm-focused]:pr-6'
          "
          :default="item.default"
          disableCloseBrackets
          :disabled="props.isReadOnly"
          disableEnter
          disableTabIndent
          lineWrapping
          :enum="item.enum ?? []"
          :envVariables="envVariables"
          :environment="environment"
          :examples="item.examples ?? []"
          :max="item.maximum"
          :min="item.minimum"
          :modelValue="item.value"
          :nullable="Boolean(item.nullable)"
          placeholder="Value"
          :type="item.type"
          :workspace="workspace"
          @blur="emit('inputBlur')"
          @focus="emit('inputFocus')"
          @selectVariable="(v: string) => handleSelectVariable(idx, 'value', v)"
          @update:modelValue="
            (v: string) => emit('updateRow', idx, 'value', v)
          ">
          <template #icon>
            <ScalarButton
              v-if="showDeleteButton(item) && !item.required"
              :class="{
                '-mr-0.5': hasItemProperties(item),
              }"
              class="text-c-2 hover:text-c-1 hover:bg-b-2 z-context hidden h-fit rounded p-1 group-hover:flex group-has-[.cm-focused]:flex"
              size="sm"
              variant="ghost"
              @click="emit('deleteRow', idx)">
              <ScalarIconTrash class="size-3.5" />
            </ScalarButton>
            <RequestTableTooltip
              v-if="hasItemProperties(item)"
              :item="{ ...item, default: flattenValue(item) }" />
          </template>
        </CodeInput>
      </DataTableCell>
      <DataTableCell
        v-if="showUploadButton"
        class="group/upload flex items-center justify-center whitespace-nowrap">
        <template v-if="item.file">
          <div
            class="text-c-2 filemask flex w-full max-w-[100%] items-end justify-end overflow-hidden p-1">
            <span>{{ item.file?.name }}</span>
          </div>
          <button
            class="bg-b-2 centered-x centered-y absolute hidden w-[calc(100%_-_8px)] rounded p-0.5 text-center text-xs font-medium group-hover/upload:block"
            type="button"
            @click="emit('removeFile', idx)">
            Delete
          </button>
        </template>
        <template v-else>
          <div class="p-0.5">
            <ScalarButton
              class="bg-b-2 hover:bg-b-3 text-c-2 h-fit border-0 py-px shadow-none"
              size="sm"
              variant="outlined"
              @click="handleFileUpload(idx)">
              <span>Upload File</span>
              <ScalarIcon
                class="ml-1"
                icon="Upload"
                size="xs"
                thickness="2.5" />
            </ScalarButton>
          </div>
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
  font-size: var(--scalar-small);
  padding: 6px 8px;
  width: 100%;
}
:deep(.cm-content):has(.cm-pill) {
  padding: 6px 8px;
}
:deep(.cm-content .cm-pill:not(:last-of-type)) {
  margin-right: 0.5px;
}
:deep(.cm-content .cm-pill:not(:first-of-type)) {
  margin-left: 0.5px;
}
:deep(.cm-line) {
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
}
.filemask {
  mask-image: linear-gradient(
    to right,
    transparent 0,
    var(--scalar-background-2) 20px
  );
}
</style>
