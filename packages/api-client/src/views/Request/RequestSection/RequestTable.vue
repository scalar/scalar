<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarTooltip } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import type { RouteLocationRaw } from 'vue-router'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import type { EnvVariable } from '@/store/active-entities'

import {
  hasEmptyRequiredParameter,
  hasItemProperties,
  parameterIsInvalid,
} from '../libs/request'
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

const flattenValue = (item: RequestExampleParameter) => {
  return Array.isArray(item.default) && item.default.length === 1
    ? item.default[0]
    : item.default
}
</script>
<template>
  <DataTable
    class="group/table flex-1"
    :columns="columns">
    <DataTableRow
      v-for="(item, idx) in items"
      :key="idx"
      :class="{
        alert: parameterIsInvalid(item).value,
        error: hasEmptyRequiredParameter(item),
      }">
      <label class="contents">
        <template v-if="isGlobal">
          <RouterLink
            class="!border-r-1/2 border-t-1/2 text-c-2 flex items-center justify-center"
            :to="item.route ?? {}">
            <span class="sr-only">Global</span>
            <ScalarTooltip
              as="div"
              side="top">
              <template #trigger>
                <ScalarIcon
                  class="text-c-1"
                  icon="Globe"
                  size="xs" />
              </template>
              <template #content>
                <div
                  class="w-content bg-b-1 z-100 text-xxs text-c-1 pointer-events-none z-10 grid max-w-[320px] gap-1.5 rounded p-2 leading-5 shadow-lg">
                  <div class="text-c-1 flex items-center">
                    <span class="text-pretty">
                      Global cookies are shared across the whole workspace.
                    </span>
                  </div>
                </div>
              </template>
            </ScalarTooltip>
          </RouterLink>
        </template>
        <template v-else>
          <span class="sr-only">
            Row {{ item.enabled ? 'Enabled' : 'Disabled' }}
          </span>
          <DataTableCheckbox
            class="!border-r-1/2"
            :disabled="props.hasCheckboxDisabled"
            :modelValue="item.enabled"
            @update:modelValue="(v) => emit('toggleRow', idx, v)" />
        </template>
      </label>
      <DataTableCell>
        <CodeInput
          disableCloseBrackets
          :disabled="props.isReadOnly"
          disableEnter
          disableTabIndent
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
          :class="{
            'pr-6': hasItemProperties(item),
          }"
          :default="item.default"
          disableCloseBrackets
          :disabled="props.isReadOnly"
          disableEnter
          disableTabIndent
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
            <RequestTableTooltip
              v-if="hasItemProperties(item)"
              :item="{ ...item, default: flattenValue(item) }" />
          </template>
        </CodeInput>
      </DataTableCell>
      <DataTableCell
        v-if="showUploadButton"
        class="group/upload relative overflow-hidden text-ellipsis whitespace-nowrap p-1">
        <template v-if="item.file">
          <div
            class="text-c-2 filemask flex max-w-[100%] items-end justify-end overflow-hidden">
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
          <ScalarButton
            class="bg-b-2 hover:bg-b-3 text-c-2 border-0 py-px shadow-none"
            size="sm"
            variant="outlined"
            @click="handleFileUpload(idx)">
            <span>Upload File</span>
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
