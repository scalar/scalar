<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Entries } from 'type-fest'
import { computed, watch } from 'vue'

import { useFileDialog } from '@/hooks'
import RequestBodyForm from '@/v2/blocks/request-block/components/RequestBodyForm.vue'
import { getFileName } from '@/v2/blocks/request-block/helpers/files'
import { getExampleFromBody } from '@/v2/blocks/request-block/helpers/get-request-body-example'
import { CodeInput } from '@/v2/components/code-input'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from '@/v2/components/data-table'
import { CollapsibleSection } from '@/v2/components/layout'

const { requestBody, exampleKey, environment, title } = defineProps<{
  /** Request body */
  requestBody?: RequestBodyObject
  /** Currently selected example key for the current operation */
  exampleKey: string
  /** Display title */
  title: string
  /** Selected environment */
  environment: XScalarEnvironment
}>()

const emits = defineEmits<{
  (e: 'update:contentType', payload: { value: string }): void
  /** We use this event to update raw values */
  (
    e: 'update:value',
    payload: Pick<
      ApiReferenceEvents['operation:update:requestBody:value'],
      'payload' | 'contentType'
    >,
  ): void
  /** We use this event when updating form data only */
  (
    e: 'update:formValue',
    payload: Pick<
      ApiReferenceEvents['operation:update:requestBody:formValue'],
      'payload' | 'contentType'
    >,
  ): void
}>()

// Map a content type to a language for the code editor
const contentTypeToLanguageMap = {
  'application/json': 'json',
  'application/xml': 'xml',
  'application/yaml': 'yaml',
} as const

const contentTypes = {
  'multipart/form-data': 'Multipart Form',
  'application/x-www-form-urlencoded': 'Form URL Encoded',
  'application/octet-stream': 'Binary File',
  'application/json': 'JSON',
  'application/xml': 'XML',
  'application/yaml': 'YAML',
  'application/edn': 'EDN',
  'other': 'Other',
  'none': 'None',
} as const

/** Selected content type with default */
const selectedContentType = computed(
  () =>
    requestBody?.['x-scalar-selected-content-type']?.[exampleKey] ??
    Object.keys(requestBody?.content ?? {})[0] ??
    'none',
)

watch(
  () => requestBody?.['x-scalar-selected-content-type']?.[exampleKey],
  (contentType) => {
    // If there's no selected content type, set it
    if (!contentType) {
      emits('update:contentType', { value: selectedContentType.value })
    }
  },
  { immediate: true },
)

/** Convert content types to options for the dropdown */
const contentTypeOptions = (
  Object.entries(contentTypes) as Entries<typeof contentTypes>
).map(([id, label]) => ({
  id,
  label,
}))

const selectedContentTypeModel = computed<{ id: string; label: string }>({
  get: () => {
    const found = contentTypeOptions.find(
      (it) => it.id === selectedContentType.value,
    )
    return found ?? contentTypeOptions.at(-1)!
  },
  set: (v) => {
    emits('update:contentType', { value: v.id })
  },
})

function handleFileUpload(callback: (file: File) => void) {
  const { open } = useFileDialog({
    onChange: (files) => {
      const file = files?.[0]
      if (file) {
        callback(file)
      }
    },
    multiple: false,
    accept: '*/*',
  })
  open()
}

/** Dereferenced example */
const example = computed(
  () =>
    requestBody &&
    getExampleFromBody(requestBody, selectedContentType.value, exampleKey),
)

/** Convert the example value to a string for the code editor */
const bodyValue = computed(() => {
  if (!example.value) {
    return ''
  }

  const value = example.value.value
  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value, null, 2)
})
</script>
<template>
  <CollapsibleSection>
    <template #title>{{ title }}</template>
    <DataTable
      :columns="['']"
      presentational>
      <DataTableHeader
        class="relative col-span-full flex h-8 cursor-pointer items-center justify-between border-r-0 !p-0">
        <ScalarListbox
          v-model="selectedContentTypeModel"
          :options="contentTypeOptions"
          teleport>
          <ScalarButton
            class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-3 font-normal"
            fullWidth
            variant="ghost">
            <span>{{
              contentTypes[selectedContentType as keyof typeof contentTypes] ??
              selectedContentType
            }}</span>
            <ScalarIcon
              icon="ChevronDown"
              size="md" />
          </ScalarButton>
        </ScalarListbox>
      </DataTableHeader>
      <DataTableRow>
        <!-- No Body -->
        <template v-if="selectedContentType === 'none'">
          <div
            class="text-c-3 flex min-h-10 w-full items-center justify-center border-t p-2 text-sm">
            <span>No Body</span>
          </div>
        </template>

        <!-- Binary File -->
        <template
          v-else-if="selectedContentType === 'application/octet-stream'">
          <div
            class="flex items-center justify-center overflow-hidden border-t p-1.5">
            <template
              v-if="
                getFileName(unpackProxyObject(example?.value)) !== undefined
              ">
              <span
                class="text-c-2 w-full max-w-full overflow-hidden rounded border px-1.5 py-1 text-xs whitespace-nowrap">
                {{ getFileName(unpackProxyObject(example?.value)) }}
              </span>
              <ScalarButton
                class="bg-b-2 hover:bg-b-3 text-c-2 ml-1 border-0 shadow-none"
                size="sm"
                variant="outlined"
                @click="
                  emits('update:value', {
                    payload: undefined,
                    contentType: selectedContentType,
                  })
                ">
                Delete
              </ScalarButton>
            </template>
            <template v-else>
              <ScalarButton
                class="bg-b-2 hover:bg-b-3 text-c-2 border-0 shadow-none"
                size="sm"
                variant="outlined"
                @click="
                  () =>
                    handleFileUpload((file) =>
                      emits('update:value', {
                        payload: file,
                        contentType: selectedContentType,
                      }),
                    )
                ">
                <span>Select File</span>
                <ScalarIcon
                  class="ml-1"
                  icon="Upload"
                  size="xs"
                  thickness="2.5" />
              </ScalarButton>
            </template>
          </div>
        </template>

        <!-- Form Data / URL Encoded -->
        <template
          v-else-if="
            selectedContentType === 'multipart/form-data' ||
            selectedContentType === 'application/x-www-form-urlencoded'
          ">
          <RequestBodyForm
            :environment
            :example
            :selectedContentType
            @update:formValue="
              (payload) =>
                emits('update:formValue', {
                  payload,
                  contentType: selectedContentType,
                })
            " />
        </template>

        <!-- Code/Other -->
        <template v-else>
          <CodeInput
            class="border-t px-3"
            content=""
            :environment="environment"
            :language="
              contentTypeToLanguageMap[
                selectedContentType as keyof typeof contentTypeToLanguageMap
              ] ?? 'plaintext'
            "
            lineNumbers
            lint
            :modelValue="bodyValue"
            @update:modelValue="
              (value) =>
                emits('update:value', {
                  payload: value,
                  contentType: selectedContentType,
                })
            " />
        </template>
      </DataTableRow>
    </DataTable>
  </CollapsibleSection>
</template>
<style scoped>
:deep(.cm-content) {
  font-size: var(--scalar-small);
}
</style>
