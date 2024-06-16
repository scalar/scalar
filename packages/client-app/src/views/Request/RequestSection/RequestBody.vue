<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useFileDialog } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { createRequestExampleParameter } from '@scalar/oas-utils/entities/workspace/spec'
import type { CodeMirrorLanguage } from '@scalar/use-codemirror'
import { computed, nextTick, ref, watch } from 'vue'

import RequestTable from './RequestTable.vue'

defineProps<{
  title: string
  body?: string
  formData?: any[]
}>()

const contentTypeOptions = {
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

const { activeRequest, activeExample, requestExampleMutators } = useWorkspace()

const contentType = ref<keyof typeof contentTypeOptions>('none')

const tableWrapperRef = ref<HTMLInputElement | null>(null)

/** use-codemirror package to be udpated accordingly */
const contentTypeToLanguageMap = {
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  edn: 'edn',
  other: 'html',
} as const

const codeInputLanguage = computed(() => {
  const type = contentType.value as keyof typeof contentTypeToLanguageMap
  return (contentTypeToLanguageMap[type] ?? 'plaintext') as CodeMirrorLanguage
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
    const payload = [createRequestExampleParameter({ [field]: value })]

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
  () => activeExample.value?.body.formData.value ?? [],
)

function defaultRow() {
  /** ensure one empty row by default */
  if (formParams.value.length === 0) {
    addRow()
  }
}

/** Add a new row to a given parameter list */
const addRow = () => {
  if (!activeRequest.value || !activeExample.value) return

  /** Create a new parameter instance with 'enabled' set to false */
  const newParam = createRequestExampleParameter({
    enabled: false,
  })

  const newParams = [...formParams.value, newParam]

  requestExampleMutators.edit(
    activeExample.value.uid,
    'body.formData.value',
    newParams,
  )
}

const updateRequestBody = (content: string) => {
  if (!activeRequest.value || !activeExample.value) return

  requestExampleMutators.edit(
    activeExample.value.uid,
    'body.raw.value',
    content,
  )
}

const updateActiveBody = (type: keyof typeof contentTypeOptions) => {
  if (!activeRequest.value || !activeExample.value) return

  let activeBodyType: { encoding: string; value: any } | undefined
  let bodyPath: 'body.raw.value' | 'body.formData.value' = 'body.raw.value'
  let bodyType: 'raw' | 'formData' | 'binary' = 'raw'

  if (type === 'multipartForm' || type === 'formUrlEncoded') {
    activeBodyType = { encoding: 'form-data', value: formParams.value || [] }
    bodyPath = 'body.formData.value'
    bodyType = 'formData'
  } else if (type === 'binaryFile') {
    bodyType = 'binary'
  } else {
    const rawValue = activeExample.value?.body.raw.value ?? ''
    activeBodyType = { encoding: type, value: rawValue }
    bodyPath = 'body.raw.value'
    bodyType = 'raw'
  }

  if (activeBodyType) {
    requestExampleMutators.edit(
      activeExample.value.uid,
      bodyPath,
      activeBodyType.value,
    )
  }
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

const getContentTypeOptions = Object.entries(contentTypeOptions).map(
  ([id, label]) => ({
    id,
    label,
    value: id as keyof typeof contentTypeOptions,
  }),
)

const selectedContentType = computed({
  get: () => getContentTypeOptions.find((opt) => opt.id === contentType.value),
  set: (opt) => {
    if (opt?.id) contentType.value = opt.id as keyof typeof contentTypeOptions
  },
})

const activeExampleContentType = computed(() => {
  if (!activeExample.value) return 'none'
  if (
    activeExample.value.body.formData &&
    activeExample.value.body.formData.value.length > 0
  )
    return 'multipartForm'
  if (
    activeExample.value.body.raw &&
    activeExample.value.body.raw.value.trim() !== ''
  )
    return activeExample.value.body.raw.encoding
  /** keep the content if populated */
  return contentType.value
})

/** set content type if active example has a value */
if (activeExampleContentType.value !== 'none') {
  contentType.value =
    activeExampleContentType.value as keyof typeof contentTypeOptions
}

watch(
  activeExampleContentType,
  (newType) => {
    if (newType) {
      contentType.value = newType as keyof typeof contentTypeOptions
    }
  },
  { immediate: true },
)

// we always add an empty row if its empty :)
watch(
  contentType,
  (val) => {
    if (val === 'multipartForm' || val === 'formUrlEncoded') {
      defaultRow()
    }
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
              class="font-code text-xxs w-full"
              :options="getContentTypeOptions"
              teleport>
              <ScalarButton
                class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal"
                fullWidth
                variant="ghost">
                <span>{{ selectedContentType?.label }}</span>
                <ScalarIcon
                  class="text-c-3 ml-1 mt-px"
                  icon="ChevronDown"
                  size="xs" />
              </ScalarButton>
            </ScalarListbox>
          </DataTableHeader>
        </DataTableRow>
        <DataTableRow>
          <template v-if="contentType === 'none'">
            <div
              class="text-c-3 flex min-h-10 w-full items-center justify-center p-2 text-sm">
              <span>No Body</span>
            </div>
          </template>
          <template v-else-if="contentType === 'binaryFile'">
            <div class="flex items-center justify-center p-1.5">
              <template v-if="activeExample?.body.binary">
                <span class="text-c-2">{{
                  activeExample?.body.binary.name
                }}</span>
                <button
                  type="button"
                  @click="removeBinaryFile">
                  remove
                </button>
              </template>
              <template v-else>
                <ScalarButton
                  size="sm"
                  variant="outlined"
                  @click="handleFileUpload">
                  <span>Upload File</span>
                  <ScalarIcon
                    class="ml-1"
                    icon="Upload"
                    size="xs" />
                </ScalarButton>
              </template>
            </div>
          </template>
          <template v-else-if="contentType == 'multipartForm'">
            <RequestTable
              ref="tableWrapperRef"
              class="!m-0 rounded-t-none border-1/2 border-t-0 shadow-none"
              :columns="['36px', '', '', '0.7fr']"
              :items="formParams"
              showUploadButton
              @addRow="addRow"
              @deleteRow="deleteRow"
              @removeFile="handleRemoveFileFormData"
              @updateRow="updateRow"
              @uploadFile="handleFileUploadFormData" />
          </template>
          <template v-else-if="contentType == 'formUrlEncoded'">
            <RequestTable
              ref="tableWrapperRef"
              class="!m-0 rounded-t-none border-1/2 border-t-0 shadow-none"
              :columns="['36px', '', '', '0.7fr']"
              :items="formParams"
              showUploadButton
              @addRow="addRow"
              @deleteRow="deleteRow"
              @removeFile="handleRemoveFileFormData"
              @updateRow="updateRow"
              @uploadFile="handleFileUploadFormData" />
          </template>
          <template v-else>
            <CodeInput
              content=""
              :language="codeInputLanguage"
              lineNumbers
              :modelValue="activeExample?.body.raw.value ?? ''"
              @update:modelValue="updateRequestBody" />
          </template>
        </DataTableRow>
        <!-- Hacky... but effective, extra table row to trick the last group -->
        <DataTableRow />
      </DataTable>
    </template>
  </ViewLayoutCollapse>
</template>
