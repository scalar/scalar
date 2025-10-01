<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
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

const {
  selectedContentType,
  requestBody,
  exampleKey,
  environment,
  envVariables,
  title,
} = defineProps<{
  /** Request body */
  requestBody?: RequestBodyObject
  /** Currently selected content type for the current operation */
  selectedContentType: keyof typeof contentTypes | (string & {})
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
  (e: 'update:value', payload: { value?: string | File }): void
  /** We use this event to update  */
  (
    e: 'add:formRow',
    payload: Partial<{ key: string; value?: string | File }>,
  ): void
  (
    e: 'update:formRow',
    payload: {
      index: number
      payload: Partial<{ key: string; value?: string | File }>
    },
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

/** Convert content types to options for the dropdown */
const contentTypeOptions = (
  Object.entries(contentTypes) as Entries<typeof contentTypes>
).map(([id, label]) => ({
  id,
  label,
}))

const selectedContentTypeModel = computed<{ id: string; label: string }>({
  get: () => {
    const found = contentTypeOptions.find((it) => it.id === selectedContentType)
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
    getExampleFromBody(requestBody, selectedContentType, exampleKey),
)
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
            <template v-if="getFileName(example?.value) !== undefined">
              <span
                class="text-c-2 w-full max-w-full overflow-hidden rounded border px-1.5 py-1 text-xs whitespace-nowrap">
                {{ getFileName(example?.value) }}
              </span>
              <ScalarButton
                class="bg-b-2 hover:bg-b-3 text-c-2 ml-1 border-0 shadow-none"
                size="sm"
                variant="outlined"
                @click="emits('update:value', { value: undefined })">
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
                      emits('update:value', { value: file }),
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
            :data="
              Object.entries(
                typeof example?.value === 'object' ? example.value : {},
              ).map(([key, value]) => ({
                name: key,
                value: value as any,
              }))
            "
            :envVariables="envVariables"
            :environment="environment"
            showUploadButton
            @uploadFile="
              (index) =>
                handleFileUpload((file) => {
                  if (index !== undefined) {
                    return emits('update:formRow', {
                      index,
                      payload: { value: file ?? undefined },
                    })
                  }
                  emits('add:formRow', { value: file ?? undefined })
                })
            " />
        </template>
        <template
          v-else-if="
            selectedContentType === 'application/x-www-form-urlencoded'
          ">
          <OperationTable
            :data="
              Object.entries(
                typeof example?.value === 'object' ? example.value : {},
              ).map(([key, value]) => ({
                name: key,
                value: String(value),
              }))
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
            :modelValue="example?.value ?? ''"
            @update:modelValue="(value) => emits('update:value', { value })" />
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
