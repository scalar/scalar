<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarTooltip } from '@scalar/components'
import { ScalarIconTrash } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { CodeInput } from '@/components/CodeInput'
import {
  DataTableCell,
  DataTableCheckbox,
  DataTableRow,
} from '@/components/DataTable'
import type { EnvVariable } from '@/store'
import OperationTableTooltip from '@/v2/blocks/scalar-operation-block/components/OperationTableTooltip.vue'
import { validateParameter } from '@/v2/blocks/scalar-operation-block/helpers/validate-parameter'

const {
  data,
  hasCheckboxDisabled,
  invalidParams,
  isReadOnly,
  showUploadButton,
} = defineProps<{
  data: TableRow
  isReadOnly?: boolean
  hasCheckboxDisabled?: boolean
  invalidParams?: Set<string>
  label?: string
  /** TODO: remove as soon as we migrate to the new store */
  environment: Environment
  envVariables: EnvVariable[]
  showUploadButton?: boolean
}>()

const emits = defineEmits<{
  (
    e: 'updateRow',
    payload: Partial<{ key: string; value: string; isEnabled: boolean }>,
  ): void
  (e: 'deleteRow'): void
  (e: 'uploadFile'): void
  (e: 'removeFile'): void
}>()

export type TableRow = {
  name: string
  value: string | File | null
  globalRoute?: string
  isDisabled?: boolean
  schema?: SchemaObject
  isRequired?: boolean
}

const defaultValue = computed(() => data.schema?.default as string)
const enumValue = computed(() => data.schema?.enum as string[])
const minimumValue = computed(() =>
  data.schema && 'minimum' in data.schema ? data.schema.minimum : undefined,
)
const maximumValue = computed(() =>
  data.schema && 'maximum' in data.schema ? data.schema.maximum : undefined,
)
const typeValue = computed(() =>
  data.schema && 'type' in data.schema ? data.schema.type : undefined,
)

const validationResult = validateParameter(data.schema, data.value)

const isFileInstance = (input: unknown): input is File => {
  return input instanceof File
}

const valueModel = computed({
  get: () => {
    if (data.value instanceof File) {
      return data.value.name
    }

    if (data.value === null) {
      return ''
    }
    return data.value
  },
  set: (val: string | File | null) => {
    if (typeof val === 'string') {
      emits('updateRow', { value: val })
    }
  },
})
</script>

<template>
  <DataTableRow
    :id="data.name"
    :class="{
      alert: validationResult.ok === false,
      error: validationResult.ok === false && invalidParams?.has(data.name),
    }">
    <template v-if="data.globalRoute !== undefined">
      <RouterLink
        class="text-c-2 flex items-center justify-center border-t !border-r"
        :to="data.globalRoute ?? {}">
        <span class="sr-only">Global</span>
        <ScalarTooltip
          content="Global cookies are shared across the whole workspace."
          placement="top">
          <ScalarIcon
            class="text-c-1"
            icon="Globe"
            size="xs"
            tabindex="0" />
        </ScalarTooltip>
      </RouterLink>
    </template>
    <template v-else>
      <DataTableCheckbox
        class="!border-r"
        :disabled="hasCheckboxDisabled ?? false"
        :modelValue="!data.isDisabled"
        @update:modelValue="(v) => emits('updateRow', { isEnabled: v })" />
    </template>
    <!-- Key -->
    <DataTableCell>
      <CodeInput
        :aria-label="`${label} Key`"
        disableCloseBrackets
        :disabled="isReadOnly"
        disableEnter
        disableTabIndent
        :envVariables="envVariables"
        :environment="environment"
        lineWrapping
        :modelValue="data.name"
        placeholder="Key"
        :required="Boolean(data.isRequired)"
        @selectVariable="(v: string) => emits('updateRow', { key: v })"
        @update:modelValue="(v: string) => emits('updateRow', { key: v })" />
    </DataTableCell>
    <!-- Value -->
    <DataTableCell>
      <CodeInput
        :aria-label="`${label} Value`"
        class="pr-6 group-hover:pr-10 group-has-[.cm-focused]:pr-10"
        :default="defaultValue"
        disableCloseBrackets
        :disabled="isReadOnly"
        disableEnter
        disableTabIndent
        :enum="enumValue ?? []"
        :envVariables="envVariables"
        :environment="environment"
        lineWrapping
        :max="maximumValue"
        :min="minimumValue"
        :modelValue="valueModel"
        placeholder="Value"
        :type="typeValue"
        @selectVariable="(v: string) => emits('updateRow', { value: v })"
        @update:modelValue="(v: string) => emits('updateRow', { value: v })">
        <template #icon>
          <ScalarButton
            v-if="Boolean(data.name || data.value) && !data.isRequired"
            class="text-c-2 hover:text-c-1 hover:bg-b-2 z-context -mr-0.5 hidden h-fit rounded p-1 group-hover:flex group-has-[.cm-focused]:flex"
            size="sm"
            variant="ghost"
            @click="emits('deleteRow')">
            <ScalarIconTrash class="size-3.5" />
          </ScalarButton>
          <OperationTableTooltip
            v-if="data.schema"
            :schema="data.schema"
            :value="data.value" />
        </template>
      </CodeInput>
    </DataTableCell>
    <!-- File upload -->
    <DataTableCell
      v-if="showUploadButton"
      class="group/upload flex items-center justify-center whitespace-nowrap">
      <template v-if="isFileInstance(data.value)">
        <div
          class="text-c-2 filemask flex w-full max-w-[100%] items-center justify-center overflow-hidden p-1">
          <span>{{ data.value.name }}</span>
        </div>
        <button
          class="bg-b-2 centered-x centered-y absolute hidden w-[calc(100%_-_8px)] rounded p-0.5 text-center text-xs font-medium group-hover/upload:block"
          type="button"
          @click="emits('removeFile')">
          Delete
        </button>
      </template>
      <template v-else>
        <div class="p-0.5">
          <ScalarButton
            class="bg-b-2 hover:bg-b-3 text-c-2 h-fit border-0 py-px shadow-none"
            size="sm"
            variant="outlined"
            @click="emits('uploadFile')">
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
</template>
