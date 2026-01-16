<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarTooltip } from '@scalar/components'
import { ScalarIconTrash } from '@scalar/icons'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { getFileName } from '@/v2/blocks/request-block/helpers/files'
import { validateParameter } from '@/v2/blocks/request-block/helpers/validate-parameter'
import { CodeInput } from '@/v2/components/code-input'
import {
  DataTableCell,
  DataTableCheckbox,
  DataTableRow,
} from '@/v2/components/data-table'

import RequestTableTooltip from './RequestTableTooltip.vue'

export type TableRow = {
  name: string
  value: string | File
  description?: string
  globalRoute?: string
  isDisabled?: boolean
  schema?: SchemaObject
  isRequired?: boolean
}

const {
  data,
  environment,
  hasCheckboxDisabled = false,
  invalidParams,
  isReadOnly = false,
  label,
  showUploadButton = false,
} = defineProps<{
  data: TableRow
  environment: XScalarEnvironment
  isReadOnly?: boolean
  hasCheckboxDisabled?: boolean
  invalidParams?: Set<string>
  label?: string
  showUploadButton?: boolean
}>()

const emits = defineEmits<{
  (
    e: 'upsertRow',
    payload: { name: string; value: string; isDisabled: boolean },
  ): void
  (e: 'deleteRow'): void
  (e: 'uploadFile'): void
  (e: 'removeFile'): void
}>()

/** Unpacked value for consistent access throughout the component */
const unpackedValue = computed(() => unpackProxyObject(data.value))

/** Check if the value is a File instance */
const isFile = computed(() => unpackedValue.value instanceof File)

/** Extract schema properties for better readability */
const schemaProps = computed(() => {
  if (!data.schema) {
    return {
      default: undefined,
      enum: undefined,
      minimum: undefined,
      maximum: undefined,
      type: undefined,
      examples: [],
    }
  }

  return {
    default: data.schema.default as string | undefined,
    enum: data.schema.enum as string[] | undefined,
    minimum: 'minimum' in data.schema ? data.schema.minimum : undefined,
    maximum: 'maximum' in data.schema ? data.schema.maximum : undefined,
    type: 'type' in data.schema ? data.schema.type : undefined,
    examples: data.schema.examples?.map((example) => String(example)) ?? [],
  }
})

/** Determine if validation has failed */
const hasValidationError = computed(
  () => validateParameter(data.schema, data.value).ok === false,
)

/** Determine if this specific parameter has an error from the parent */
const hasInvalidParam = computed(
  () => hasValidationError.value && invalidParams?.has(data.name),
)

/** Display value handles File instances and shows filename instead */
const displayValue = computed(
  () =>
    (isFile.value
      ? getFileName(unpackedValue.value as File)
      : (unpackedValue.value as string)) ?? '',
)

/** Determine if the delete button should be shown */
const showDeleteButton = computed(
  () => Boolean(data.name || data.value) && !data.isRequired,
)

/** Handle row updates while preserving existing properties */
const handleUpdateRow = (
  payload: Partial<{ name: string; value: string; isDisabled: boolean }>,
): void => {
  if (isFile.value) {
    return
  }

  emits('upsertRow', {
    name: data.name,
    value: data.value as string,
    isDisabled: data.isDisabled ?? false,
    ...payload,
  })
}
</script>

<template>
  <DataTableRow
    :id="data.name"
    :class="{
      alert: hasValidationError,
      error: hasInvalidParam,
    }">
    <!-- Global route indicator or checkbox -->
    <template v-if="data.globalRoute">
      <RouterLink
        class="text-c-2 flex items-center justify-center border-t border-r!"
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
        class="border-r!"
        :disabled="hasCheckboxDisabled"
        :modelValue="!data.isDisabled"
        @update:modelValue="(v) => handleUpdateRow({ isDisabled: !v })" />
    </template>

    <!-- Name input -->
    <DataTableCell>
      <CodeInput
        :aria-label="`${label} Key`"
        disableCloseBrackets
        :disabled="isReadOnly"
        disableEnter
        disableTabIndent
        :environment="environment"
        lineWrapping
        :modelValue="data.name"
        placeholder="Key"
        :required="Boolean(data.isRequired)"
        @selectVariable="(v: string) => handleUpdateRow({ name: v })"
        @update:modelValue="(v) => handleUpdateRow({ name: v })" />
    </DataTableCell>

    <!-- Value input -->
    <DataTableCell>
      <CodeInput
        :aria-label="`${label} Value`"
        class="pr-6 group-hover:pr-10 group-has-[.cm-focused]:pr-10"
        :default="schemaProps.default"
        disableCloseBrackets
        :disabled="isReadOnly"
        disableEnter
        disableTabIndent
        :enum="schemaProps.enum ?? []"
        :environment="environment"
        :examples="schemaProps.examples"
        lineWrapping
        :max="schemaProps.maximum"
        :min="schemaProps.minimum"
        :modelValue="displayValue"
        placeholder="Value"
        :type="schemaProps.type"
        @update:modelValue="(v) => handleUpdateRow({ value: v })">
        <template #icon>
          <ScalarButton
            v-if="showDeleteButton"
            class="text-c-2 hover:text-c-1 hover:bg-b-2 z-context -mr-0.5 hidden h-fit rounded p-1 group-hover:flex group-has-[.cm-focused]:flex"
            size="sm"
            variant="ghost"
            @click="emits('deleteRow')">
            <ScalarIconTrash class="size-3.5" />
          </ScalarButton>
          <RequestTableTooltip
            v-if="data.schema"
            :description="data.description"
            :schema="data.schema"
            :value="data.value" />
        </template>
      </CodeInput>
    </DataTableCell>

    <!-- File upload cell -->
    <DataTableCell
      v-if="showUploadButton"
      class="group/upload flex items-center justify-center whitespace-nowrap">
      <template v-if="isFile">
        <div
          class="text-c-2 filemask flex w-full max-w-full items-center justify-center overflow-hidden p-1">
          <span>{{ displayValue }}</span>
        </div>
        <button
          class="bg-b-2 centered-x centered-y absolute hidden w-[calc(100%-8px)] rounded p-0.5 text-center text-xs font-medium group-hover/upload:block"
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
            <span>Select File</span>
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
