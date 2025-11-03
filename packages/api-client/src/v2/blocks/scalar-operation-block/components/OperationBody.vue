<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Entries } from 'type-fest'
import { computed } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useFileDialog } from '@/hooks'
import type { EnvVariable } from '@/store/active-entities'
import OperationTable from '@/v2/blocks/scalar-operation-block/components/OperationTable.vue'
import { getFileName } from '@/v2/blocks/scalar-operation-block/helpers/files'
import { getExampleFromBody } from '@/v2/blocks/scalar-operation-block/helpers/get-request-body-example'

const { requestBody, exampleKey, environment, envVariables, title } =
  defineProps<{
    /** Request body */
    requestBody?: RequestBodyObject
    /** Currently selected example key for the current operation */
    exampleKey: string
    /** Display title */
    title: string

    /** TODO: remove when we do the migration */
    environment: Environment
    envVariables: EnvVariable[]
  }>()

const emits = defineEmits<{
  (e: 'update:contentType', payload: { value: string }): void
  /** We use this event to update raw values */
  (
    e: 'update:value',
    payload: { value?: string | File; contentType: string },
  ): void
  /** We use this event to update  */
  (
    e: 'add:formRow',
    payload: {
      data: Partial<{ key: string; value?: string | File }>
      contentType: string
    },
  ): void
  (
    e: 'update:formRow',
    payload: {
      index: number
      data: Partial<{ key: string; value: string | File | null }>
      contentType: string
    },
  ): void
  (e: 'delete:fromRow', payload: { index: number; contentType: string }): void
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

const selectedContentType = computed(() => {
  return (
    requestBody?.['x-scalar-selected-content-type']?.[exampleKey] ??
    Object.keys(requestBody?.content ?? {})[0] ??
    'other'
  )
})

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

function handleFileUpload(callback: (file: File | undefined) => void) {
  const { open } = useFileDialog({
    onChange: async (files) => {
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

const example = computed(
  () =>
    requestBody &&
    getExampleFromBody(requestBody, selectedContentType.value, exampleKey),
)

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

const tableRows = computed(() => {
  if (!example.value) {
    return []
  }

  return Array.isArray(example.value.value) ? example.value.value : []
})
</script>
<template>
  <ViewLayoutCollapse>
    <template #title>{{ title }}</template>
    <DataTable
      :columns="['']"
      presentational>
      <DataTableHeader
        class="relative col-span-full flex h-8 cursor-pointer items-center justify-between !p-0">
        <ScalarListbox
          v-model="selectedContentTypeModel"
          :options="contentTypeOptions"
          teleport>
          <ScalarButton
            class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-3 font-normal"
            fullWidth
            variant="ghost">
            <span>{{ selectedContentType }}</span>
            <ScalarIcon
              icon="ChevronDown"
              size="md" />
          </ScalarButton>
        </ScalarListbox>
      </DataTableHeader>
      <DataTableRow>
        <template v-if="selectedContentType === 'none'">
          <div
            class="text-c-3 flex min-h-10 w-full items-center justify-center border-t p-2 text-sm">
            <span>No Body</span>
          </div>
        </template>
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
                    value: undefined,
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
                        value: file,
                        contentType: selectedContentType,
                      }),
                    )
                ">
                <span>Upload File</span>
                <ScalarIcon
                  class="ml-1"
                  icon="Upload"
                  size="xs"
                  thickness="2.5" />
              </ScalarButton>
            </template>
          </div>
        </template>
        <template v-else-if="selectedContentType === 'multipart/form-data'">
          <OperationTable
            :data="tableRows"
            :envVariables="envVariables"
            :environment="environment"
            showUploadButton
            @addRow="
              (payload) =>
                emits('add:formRow', {
                  data: payload,
                  contentType: selectedContentType,
                })
            "
            @updateRow="
              (index, payload) =>
                emits('update:formRow', {
                  index,
                  data: payload,
                  contentType: selectedContentType,
                })
            "
            @uploadFile="
              (index) =>
                handleFileUpload((file) => {
                  if (index !== undefined) {
                    return emits('update:formRow', {
                      index,
                      data: { value: file ?? undefined },
                      contentType: selectedContentType,
                    })
                  }
                  emits('add:formRow', {
                    data: { value: file ?? undefined },
                    contentType: selectedContentType,
                  })
                })
            "
            @removeFile="
              (index) =>
                emits('update:formRow', {
                  contentType: selectedContentType,
                  index,
                  data: {
                    value: null,
                  },
                })
            "
            @deleteRow="
              (index) =>
                emits('delete:fromRow', {
                  contentType: selectedContentType,
                  index,
                })
            " />
        </template>
        <template
          v-else-if="
            selectedContentType === 'application/x-www-form-urlencoded'
          ">
          <OperationTable
            :data="tableRows"
            @addRow="
              (payload) =>
                emits('add:formRow', {
                  data: payload,
                  contentType: selectedContentType,
                })
            "
            @updateRow="
              (index, payload) =>
                emits('update:formRow', {
                  index,
                  data: payload,
                  contentType: selectedContentType,
                })
            "
            @deleteRow="
              (index) =>
                emits('delete:fromRow', {
                  contentType: selectedContentType,
                  index,
                })
            "
            :envVariables="envVariables"
            :environment="environment" />
        </template>
        <template v-else>
          <CodeInput
            class="border-t px-3"
            content=""
            :envVariables="envVariables"
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
                  value,
                  contentType: selectedContentType,
                })
            " />
        </template>
      </DataTableRow>
    </DataTable>
  </ViewLayoutCollapse>
</template>
<style scoped>
:deep(.cm-content) {
  font-size: var(--scalar-small);
}
</style>
