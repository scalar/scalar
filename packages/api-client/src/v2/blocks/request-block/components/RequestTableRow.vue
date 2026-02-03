<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarIconButton } from '@scalar/components'
import { ScalarIconGlobe, ScalarIconTrash } from '@scalar/icons'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import { resolve } from '@scalar/workspace-store/resolve'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  ParameterObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, watch } from 'vue'

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
  /** Track the original parameter so we can update it */
  originalParameter?: ParameterObject
}

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
    e: 'upsertRow',
    payload: { name: string; value: string | File; isDisabled: boolean },
  ): void
  (e: 'deleteRow'): void
  (e: 'uploadFile'): void
  (e: 'removeFile'): void
  (e: 'navigate', route: string): void
}>()

/**
 * Track local state for the row
 *
 * Now this is required because of the way we get default values from the schema.
 * If we have a default value in data.value, then we update isDisabled to true. We lose the default value since now
 * we have an example where value: ''. This is why we need to track the local state and update all of the params at the
 * same time.
 */
const name = ref<string>(data.name ?? '')
const value = ref<string | File>(unpackProxyObject(data.value) ?? '')
const isDisabled = ref<boolean>(data.isDisabled ?? false)

// Keep the above state synced with the data prop
watch(
  () => data.name,
  (newName) => (name.value = newName ?? ''),
)
watch(
  () => data.value,
  (newValue) => (value.value = unpackProxyObject(newValue) ?? ''),
)
watch(
  () => data.isDisabled,
  (newIsDisabled) => (isDisabled.value = newIsDisabled ?? false),
)

/** Check if the value is a File instance */
const isFile = computed(() => value.value instanceof File)

/** Display value handles File instances and shows filename instead */
const displayValue = computed(
  () =>
    (isFile.value
      ? getFileName(value.value as File)
      : (value.value as string)) ?? '',
)

const defaultValue = computed(() => data.schema?.default as string)

/** See if we can extract enum values from the schema */
const enumValue = computed<string[]>(() => {
  if (!data.schema) {
    return []
  }

  // Grab the enum from the schema
  if (data.schema.enum) {
    return data.schema.enum.map((item) => String(item))
  }

  // Grab the enum from the items schema
  if ('items' in data.schema) {
    const resolved = resolve.schema(data.schema.items)
    if (resolved?.enum) {
      return resolved.enum.map((item) => String(item))
    }
  }

  return []
})

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
  validateParameter(data.schema, value.value),
)

/** Handle row updates while preserving existing properties */
const handleUpdateRow = (
  payload: Partial<{ name: string; value: string; isDisabled: boolean }>,
): void => {
  // Update our local state
  if (payload.name !== undefined) {
    name.value = payload.name
  }
  if (payload.value !== undefined) {
    value.value = payload.value
  }

  // Is disabled should always be false unless you explicitly set it to true
  isDisabled.value = payload.isDisabled ?? false

  // Emit all of the local state
  emit('upsertRow', {
    name: name.value,
    value: value.value,
    isDisabled: isDisabled.value,
  })
}
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
      :modelValue="!isDisabled"
      @update:modelValue="(v) => handleUpdateRow({ isDisabled: !v })" />

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
        :modelValue="name"
        placeholder="Key"
        :required="Boolean(data.isRequired)"
        @selectVariable="(v: string) => handleUpdateRow({ name: v })"
        @update:modelValue="(v) => handleUpdateRow({ name: v })" />
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
        :enum="enumValue"
        :environment="environment"
        :examples="
          data.schema?.examples?.map((example) => String(example)) ?? []
        "
        :linethrough="data.isOverridden"
        lineWrapping
        :max="maximumValue"
        :min="minimumValue"
        :modelValue="displayValue"
        placeholder="Value"
        :type="typeValue"
        @update:modelValue="(v) => handleUpdateRow({ value: v })">
        <template #icon>
          <ScalarButton
            v-if="
              Boolean(data.name || value) &&
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
            :value />
        </template>
      </CodeInput>
    </DataTableCell>

    <!-- File upload -->
    <DataTableCell
      v-if="showUploadButton"
      class="group/upload flex items-center justify-center whitespace-nowrap">
      <template v-if="isFile">
        <div
          class="text-c-2 filemask flex w-full max-w-[100%] items-center justify-center overflow-hidden p-1">
          <span>{{ displayValue }}</span>
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
