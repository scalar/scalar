<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarIconButton } from '@scalar/components'
import { ScalarIconGlobe, ScalarIconTrash } from '@scalar/icons'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { getFileName } from '@/v2/blocks/request-block/helpers/files'
import { validateParameter } from '@/v2/blocks/request-block/helpers/validate-parameter'
import { CodeInput } from '@/v2/components/code-input'
import {
  DataTableCell,
  DataTableCheckbox,
  DataTableRow,
} from '@/v2/components/data-table'

import RequestTableTooltip from './RequestTableTooltip.vue'

const {
  data,
  environment,
  hasCheckboxDisabled,
  invalidParams,
  showUploadButton,
} = defineProps<{
  data: TableRow
  hasCheckboxDisabled?: boolean
  invalidParams?: Set<string>
  label?: string
  environment: XScalarEnvironment
  showUploadButton?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'updateRow',
    payload: Partial<{ name: string; value: string; isDisabled: boolean }>,
  ): void
  (e: 'deleteRow'): void
  (e: 'uploadFile'): void
  (e: 'removeFile'): void
  (e: 'navigate', route: string): void
}>()

export type TableRow = {
  /** The parameter or field name/key */
  name: string
  /** The parameter value, can be a string, file, or null */
  value: string | File | null
  /** Optional description for the parameter */
  description?: string
  /** Optional route for global parameters (e.g., cookies shared across workspace) */
  globalRoute?: string
  /** Whether the parameter is disabled/inactive */
  isDisabled?: boolean
  /** OpenAPI schema object with type, validation rules, examples, etc. */
  schema?: SchemaObject
  /** Whether the parameter is required */
  isRequired?: boolean
  /**
   * Whether the parameter is readonly and can not be modifies directly
   * User can still override the parameter which is going to show up with the linethrough style
   */
  isReadonly?: boolean
  /** Whether the parameter is overridden later on */
  isOverridden?: boolean
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

const validationResult = computed(() =>
  validateParameter(data.schema, data.value),
)

const isFileInstance = (input: unknown): input is File => {
  return input instanceof File
}

const valueModel = computed({
  get: () => {
    const rawValue = unpackProxyObject(data.value)

    if (rawValue instanceof File) {
      return getFileName(unpackProxyObject(data.value as any)) ?? ''
    }

    if (rawValue === null) {
      return ''
    }
    return rawValue
  },
  set: (val: string | File | null) => {
    if (typeof val === 'string') {
      emit('updateRow', { value: val })
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
    <DataTableCheckbox
      class="!border-r"
      :disabled="hasCheckboxDisabled ?? false"
      :modelValue="!data.isDisabled"
      @update:modelValue="(v) => emit('updateRow', { isDisabled: !v })" />

    <!-- Name -->
    <DataTableCell>
      <CodeInput
        :aria-label="`${label} Key`"
        disableCloseBrackets
        :disabled="data.isReadonly"
        disableEnter
        disableTabIndent
        :environment="environment"
        lineWrapping
        :modelValue="data.name"
        placeholder="Key"
        :required="Boolean(data.isRequired)"
        @selectVariable="(v: string) => emit('updateRow', { name: v })"
        @update:modelValue="(v: string) => emit('updateRow', { name: v })" />
    </DataTableCell>

    <!-- Value -->
    <DataTableCell>
      <CodeInput
        :aria-label="`${label} Value`"
        class="pr-6 group-hover:pr-10 group-has-[.cm-focused]:pr-10"
        :default="defaultValue"
        disableCloseBrackets
        :disabled="data.isReadonly"
        disableEnter
        disableTabIndent
        :enum="enumValue ?? []"
        :environment="environment"
        :examples="
          data.schema?.examples?.map((example) => String(example)) ?? []
        "
        :linethrough="data.isOverridden"
        lineWrapping
        :max="maximumValue"
        :min="minimumValue"
        :modelValue="valueModel"
        placeholder="Value"
        :type="typeValue"
        @update:modelValue="(v: string) => emit('updateRow', { value: v })">
        <template #icon>
          <ScalarButton
            v-if="
              Boolean(data.name || data.value) &&
              !data.isRequired &&
              data.isReadonly !== true
            "
            class="text-c-2 hover:text-c-1 hover:bg-b-2 z-context -mr-0.5 hidden h-fit rounded p-1 group-hover:flex group-has-[.cm-focused]:flex"
            size="sm"
            variant="ghost"
            @click="emit('deleteRow')">
            <ScalarIconTrash class="size-3.5" />
          </ScalarButton>

          <ScalarIconButton
            v-if="data.globalRoute !== undefined"
            class="text-c-2 hover:text-c-1 hover:bg-b-2 z-context -mr-0.5 h-fit"
            :icon="ScalarIconGlobe"
            label="Global cookies are shared across the whole workspace. Click to navigate."
            size="xs"
            tooltip="top"
            variant="ghost"
            @click="emit('navigate', data.globalRoute)" />

          <RequestTableTooltip
            v-if="data.isReadonly"
            description="This is a readonly property and you can not modify it! If you want to change it you have to override it or disable it using the checkbox"
            :value="null" />
          <RequestTableTooltip
            v-else-if="data.schema"
            :description="data.description"
            :schema="data.schema"
            :value="data.value" />
        </template>
      </CodeInput>
    </DataTableCell>

    <!-- File upload -->
    <DataTableCell
      v-if="showUploadButton"
      class="group/upload flex items-center justify-center whitespace-nowrap">
      <template v-if="isFileInstance(unpackProxyObject(data.value))">
        <div
          class="text-c-2 filemask flex w-full max-w-[100%] items-center justify-center overflow-hidden p-1">
          <span>{{ getFileName(unpackProxyObject(data.value)) }}</span>
        </div>
        <button
          class="bg-b-2 centered-x centered-y absolute hidden w-[calc(100%_-_8px)] rounded p-0.5 text-center text-xs font-medium group-hover/upload:block"
          type="button"
          @click="emit('removeFile')">
          Delete
        </button>
      </template>
      <template v-else>
        <div class="p-0.5">
          <ScalarButton
            class="bg-b-2 hover:bg-b-3 text-c-2 h-fit border-0 py-px shadow-none"
            size="sm"
            variant="outlined"
            @click="emit('uploadFile')">
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
