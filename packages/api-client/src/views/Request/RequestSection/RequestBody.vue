<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useFileDialog } from '@/hooks'
import { useWorkspace } from '@/store'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { requestExampleParametersSchema } from '@scalar/oas-utils/entities/spec'
import type { CodeMirrorLanguage } from '@scalar/use-codemirror'
import type { Entries } from 'type-fest'
import { computed, nextTick, ref, watch } from 'vue'

import RequestTable from './RequestTable.vue'

defineProps<{
  title: string
  body?: string
  formData?: any[]
}>()

const { activeRequest, activeExample, requestExampleMutators } = useWorkspace()

/** use-codemirror package to be udpated accordingly */
const contentTypeToLanguageMap = {
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  edn: 'edn',
  other: 'html',
} as const

const contentTypes = {
  multipartForm: 'Multipart Form',
  formUrlEncoded: 'Form URL Encoded',
  binaryFile: 'Binary File',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  edn: 'EDN',
  other: 'Other',
  none: 'None',
} as const
type Content = keyof typeof contentTypes

/** Convert content types to options for the dropdown */
const contentTypeOptions = (
  Object.entries(contentTypes) as Entries<typeof contentTypes>
).map(([id, label]) => ({
  id,
  label,
}))

/** Match the activeBody to the contentTypeOptions */
const activeExampleContentType = computed(() => {
  if (!activeExample.value) return 'none'

  // Form
  if (activeExample.value.body.activeBody === 'formData')
    return activeExample.value.body.formData?.encoding === 'urlencoded'
      ? 'formUrlEncoded'
      : 'multipartForm'
  // Raw
  else if (
    activeExample.value.body.activeBody === 'raw' &&
    activeExample.value.body.raw?.encoding
  )
    return activeExample.value.body.raw.encoding

  return 'none'
})
/** Selected ref from options above */
const selectedContentType = computed({
  get: () =>
    contentTypeOptions.find(
      (opt) => opt.id === activeExampleContentType.value,
    ) ?? contentTypeOptions[contentTypeOptions.length - 1],
  set: (opt) => {
    if (opt?.id) updateActiveBody(opt.id)
  },
})
const tableWrapperRef = ref<HTMLInputElement | null>(null)

const codeInputLanguage = computed(() => {
  const type = selectedContentType.value
    .id as keyof typeof contentTypeToLanguageMap
  return contentTypeToLanguageMap[type] ?? 'plaintext'
})

function deleteRow() {
  console.log('deleteRow')
}

/** Update a field in a parameter row */
const updateRow = (rowIdx: number, field: 'key' | 'value', value: string) => {
  if (!activeRequest.value || !activeExample.value) return

  const currentParams = formParams.value
  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
    updatedParams[rowIdx] = { ...updatedParams[rowIdx], [field]: value }

    /** enable row key or value is filled */
    if (
      updatedParams[rowIdx].key !== '' ||
      updatedParams[rowIdx].value !== ''
    ) {
      updatedParams[rowIdx].enabled = true
    }

    /** check key and value input state */
    if (
      updatedParams[rowIdx].key === '' &&
      updatedParams[rowIdx].value === ''
    ) {
      /** remove if empty */
      updatedParams.splice(rowIdx, 1)
    }

    requestExampleMutators.edit(
      activeExample.value.uid,
      'body.formData.value',
      updatedParams,
    )
  } else {
    /** if there is no row at the index, add a new one */
    const payload = [requestExampleParametersSchema.parse({ [field]: value })]

    requestExampleMutators.edit(
      activeExample.value.uid,
      'body.formData.value',
      payload,
    )

    /** focus the new row */
    nextTick(() => {
      if (!tableWrapperRef.value) return
      const inputs = tableWrapperRef.value.querySelectorAll('input')
      const inputsIndex = field === 'key' ? 0 : 1
      inputs[inputsIndex]?.focus()
    })
  }
}

const formParams = computed(
  () => activeExample.value?.body?.formData?.value ?? [],
)

/** ensure one empty row by default */
const defaultRow = () => formParams.value.length === 0 && addRow()

/** Add a new row to a given parameter list */
const addRow = () => {
  if (!activeRequest.value || !activeExample.value) return

  /** Create a new parameter instance with 'enabled' set to false */
  const newParam = requestExampleParametersSchema.parse({
    enabled: false,
  })
  const newParams = [...formParams.value, newParam]

  // Ensure have have formData before adding
  if (activeExample.value.body.formData)
    requestExampleMutators.edit(
      activeExample.value.uid,
      'body.formData.value',
      newParams,
    )
  else
    requestExampleMutators.edit(activeExample.value.uid, 'body.formData', {
      value: newParams,
      encoding: 'form-data',
    })
}

/** Enable and disables the row */
const toggleRow = (rowIdx: number, enabled: boolean) => {
  if (!activeRequest.value || !activeExample.value) return

  const currentParams = formParams.value
  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
    updatedParams[rowIdx].enabled = enabled

    requestExampleMutators.edit(
      activeExample.value.uid,
      'body.formData.value',
      updatedParams,
    )
  }
}

const updateRequestBody = (value: string) => {
  if (!activeRequest.value || !activeExample.value) return

  // Ensure we have a raw value before adding
  if (activeExample.value.body.raw)
    requestExampleMutators.edit(
      activeExample.value.uid,
      'body.raw.value',
      value,
    )
  else
    requestExampleMutators.edit(activeExample.value.uid, 'body.raw', {
      value,
      encoding: codeInputLanguage.value,
    })
}

const getBodyType = (type: Content) => {
  if (type === 'multipartForm' || type === 'formUrlEncoded') {
    return 'formData'
  } else if (type === 'binaryFile') {
    return 'binary'
  }
  return 'raw'
}

const updateActiveBody = (type: Content) => {
  if (!activeExample.value) return
  const bodyType = getBodyType(type)

  requestExampleMutators.edit(
    activeExample.value.uid,
    'body.activeBody',
    bodyType,
  )
}

const handleFileUploadFormData = async (rowIdx: number) => {
  const { open } = useFileDialog({
    onChange: async (files) => {
      const file = files?.[0]
      if (file && activeRequest.value && activeExample.value) {
        const currentParams = formParams.value
        const updatedParams = [...currentParams]
        updatedParams[rowIdx] = {
          ...updatedParams[rowIdx],
          file,
        }
        requestExampleMutators.edit(
          activeExample.value.uid,
          'body.formData.value',
          updatedParams,
        )
      }
    },
    multiple: false,
    accept: '*/*',
  })
  open()
}

function removeBinaryFile() {
  if (!activeRequest.value || !activeExample.value) return
  requestExampleMutators.edit(activeExample.value.uid, 'body.binary', undefined)
}
function handleRemoveFileFormData(rowIdx: number) {
  if (!activeRequest.value || !activeExample.value) return
  const currentParams = formParams.value
  const updatedParams = [...currentParams]
  updatedParams[rowIdx] = {
    ...updatedParams[rowIdx],
    file: undefined,
  }
  requestExampleMutators.edit(
    activeExample.value.uid,
    'body.formData.value',
    updatedParams,
  )
}

function handleFileUpload() {
  const { open } = useFileDialog({
    onChange: async (files) => {
      const file = files?.[0]
      if (file && activeRequest.value && activeExample.value) {
        requestExampleMutators.edit(
          activeExample.value.uid,
          'body.binary',
          file,
        )
      }
    },
    multiple: false,
    accept: '*/*',
  })
  open()
}

// we always add an empty row if its empty :)
watch(
  selectedContentType,
  (val) => {
    if (['multipartForm', 'formUrlEncoded'].includes(val?.id)) defaultRow()
  },
  { immediate: true },
)
</script>
<template>
  <ViewLayoutCollapse>
    <template #title>{{ title }}</template>
    <template
      v-if="body && body.length === 0 && formData && formData.length === 0">
      <div
        class="text-c-3 flex min-h-14 w-full items-center justify-center rounded border border-dashed text-center text-base">
        <span>No Body</span>
      </div>
    </template>
    <template v-else-if="formData && formData.length > 0">
      <!-- add grid component -->
    </template>
    <template v-else>
      <DataTable :columns="['']">
        <DataTableRow>
          <DataTableHeader
            class="relative col-span-full flex h-8 cursor-pointer items-center px-[2.25px] py-[2.25px]">
            <ScalarListbox
              v-model="selectedContentType"
              class="text-xxs w-full"
              fullWidth
              :options="contentTypeOptions"
              teleport>
              <ScalarButton
                class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal hover:text-c-1"
                fullWidth
                variant="ghost">
                <span>{{ selectedContentType?.label }}</span>
                <ScalarIcon
                  icon="ChevronDown"
                  size="xs"
                  thickness="2.5" />
              </ScalarButton>
            </ScalarListbox>
          </DataTableHeader>
        </DataTableRow>
        <DataTableRow>
          <template v-if="selectedContentType.id === 'none'">
            <div
              class="text-c-3 flex min-h-10 w-full items-center justify-center p-2 text-sm">
              <span>No Body</span>
            </div>
          </template>
          <template v-else-if="selectedContentType.id === 'binaryFile'">
            <div class="flex items-center justify-center p-1.5 overflow-hidden">
              <template v-if="activeExample?.body.binary">
                <span
                  class="text-c-2 text-xs w-full border rounded p-1 max-w-full overflow-hidden whitespace-nowrap">
                  {{ (activeExample?.body.binary as File).name }}
                </span>
                <ScalarButton
                  class="bg-b-2 hover:bg-b-3 border-0 text-c-2 ml-1 shadow-none"
                  size="sm"
                  variant="outlined"
                  @click="removeBinaryFile">
                  Delete
                </ScalarButton>
              </template>
              <template v-else>
                <ScalarButton
                  class="bg-b-2 hover:bg-b-3 border-0 text-c-2 shadow-none"
                  size="sm"
                  variant="outlined"
                  @click="handleFileUpload">
                  <span>Upload File</span>
                  <ScalarIcon
                    class="ml-1"
                    icon="UploadSimple"
                    size="xs"
                    thickness="2.5" />
                </ScalarButton>
              </template>
            </div>
          </template>
          <template v-else-if="selectedContentType.id == 'multipartForm'">
            <RequestTable
              ref="tableWrapperRef"
              class="!m-0 rounded-t-none shadow-none border-l-0 border-r-0 border-t-0 border-b-0"
              :columns="['32px', '', '', '61px']"
              :items="formParams"
              showUploadButton
              @addRow="addRow"
              @deleteRow="deleteRow"
              @removeFile="handleRemoveFileFormData"
              @toggleRow="toggleRow"
              @updateRow="updateRow"
              @uploadFile="handleFileUploadFormData" />
          </template>
          <template v-else-if="selectedContentType.id == 'formUrlEncoded'">
            <RequestTable
              ref="tableWrapperRef"
              class="!m-0 rounded-t-none border-t-0 shadow-none border-l-0 border-r-0 border-t-0 border-b-0"
              :columns="['32px', '', '', '61px']"
              :items="formParams"
              showUploadButton
              @addRow="addRow"
              @deleteRow="deleteRow"
              @removeFile="handleRemoveFileFormData"
              @toggleRow="toggleRow"
              @updateRow="updateRow"
              @uploadFile="handleFileUploadFormData" />
          </template>
          <template v-else>
            <!-- TODO: remove this as type hack when we add syntax highligting -->
            <CodeInput
              content=""
              :language="codeInputLanguage as CodeMirrorLanguage"
              lineNumbers
              lint
              :modelValue="activeExample?.body?.raw?.value ?? ''"
              @update:modelValue="updateRequestBody" />
          </template>
        </DataTableRow>
        <!-- Hacky... but effective, extra table row to trick the last group -->
        <DataTableRow />
      </DataTable>
    </template>
  </ViewLayoutCollapse>
</template>
