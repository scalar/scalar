<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useFileDialog } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { defaultRequestInstanceParameters } from '@scalar/oas-utils/entities/workspace/spec'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

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

const {
  activeRequest,
  activeInstance,
  activeInstanceIdx,
  updateRequestInstance,
} = useWorkspace()

const contentType = ref<keyof typeof contentTypeOptions>('none')
const contentTypeLabel = computed(() => contentTypeOptions[contentType.value])

const tableWrapperRef = ref<HTMLInputElement | null>(null)

/** use-codemirror package to be udpated accordingly */
const contentTypeToLanguageMap = {
  json: 'json',
  xml: 'json',
  yaml: 'yaml',
  edn: 'json',
  other: 'html',
} as const

const codeInputLanguage = computed(() => {
  const type = contentType.value as keyof typeof contentTypeToLanguageMap
  return contentTypeToLanguageMap[type] || 'plaintext'
})

function deleteRow() {
  console.log('deleteRow')
}

/** Update a field in a parameter row */
const updateRow = (rowIdx: number, field: 'key' | 'value', value: string) => {
  if (!activeRequest.value) return

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

    updateRequestInstance(
      activeRequest.value.uid,
      activeInstanceIdx,
      'body.formData.value',
      updatedParams,
    )
  } else {
    /** if there is no row at the index, add a new one */
    const payload = [{ ...defaultRequestInstanceParameters(), [field]: value }]
    updateRequestInstance(
      activeRequest.value.uid,
      activeInstanceIdx,
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
  () => activeInstance.value?.body.formData.value ?? [],
)

function defaultRow() {
  /** ensure one empty row by default */
  if (formParams.value.length === 0) {
    addRow()
  }
}

/** Add a new row to a given parameter list */
const addRow = () => {
  if (!activeRequest.value) return

  /** Create a new parameter instance with 'enabled' set to false */
  const newParam = {
    ...defaultRequestInstanceParameters(),
    enabled: false,
  }

  const newParams = [...formParams.value, newParam]

  updateRequestInstance(
    activeRequest.value.uid,
    activeInstanceIdx,
    'body.formData.value',
    newParams,
  )
}

const updateRequestBody = (content: string) => {
  if (!activeRequest.value) return

  updateRequestInstance(
    activeRequest.value.uid,
    activeInstanceIdx,
    'body.raw.value',
    content,
  )
}

const updateActiveBody = (type: keyof typeof contentTypeOptions) => {
  if (!activeRequest.value) return

  let activeBodyType: { encoding: string; value: any } | undefined
  let bodyPath: 'body.raw.value' | 'body.formData.value' = 'body.raw.value'

  if (type === 'multipartForm' || type === 'formUrlEncoded') {
    activeBodyType = { encoding: 'form-data', value: formParams.value || [] }
    bodyPath = 'body.formData.value'
  } else {
    const rawValue = activeInstance.value?.body.raw.value ?? ''
    activeBodyType = { encoding: type, value: rawValue }
    bodyPath = 'body.raw.value'
  }

  updateRequestInstance(
    activeRequest.value.uid,
    activeInstanceIdx,
    bodyPath,
    activeBodyType.value,
  )
}

const handleFileUploadFormData = async (rowIdx: number) => {
  const { open } = useFileDialog({
    onChange: async (files) => {
      const file = files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          if (!activeRequest.value) return

          const text = e.target?.result as string

          const currentParams = formParams.value
          const updatedParams = [...currentParams]
          updatedParams[rowIdx] = {
            ...updatedParams[rowIdx],
            binary: {
              file,
              value: text,
            },
          }

          console.log(updatedParams)

          updateRequestInstance(
            activeRequest.value.uid,
            activeInstanceIdx,
            'body.formData.value',
            updatedParams,
          )
        }
        reader.readAsText(file)
      }
    },
    multiple: false,
    accept: '*/*',
  })

  open()
}

function removeBinaryFile() {
  if (!activeRequest.value) return

  updateRequestInstance(
    activeRequest.value.uid,
    activeInstanceIdx,
    'body.binary',
    undefined,
  )
}

function handleRemoveFileFormData(rowIdx: number) {
  if (!activeRequest.value) return

  const currentParams = formParams.value
  const updatedParams = [...currentParams]
  updatedParams[rowIdx] = {
    ...updatedParams[rowIdx],
    binary: undefined,
  }

  updateRequestInstance(
    activeRequest.value.uid,
    activeInstanceIdx,
    'body.formData.value',
    updatedParams,
  )
}

function handleFileUpload() {
  const { open } = useFileDialog({
    onChange: async (files) => {
      const file = files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          if (!activeRequest.value) return

          const text = e.target?.result as string
          updateRequestInstance(
            activeRequest.value.uid,
            activeInstanceIdx,
            'body.binary',
            {
              file,
              value: text,
            },
          )
        }
        reader.readAsText(file)
      }
    },
    multiple: false,
    accept: '*/*',
  })

  open()
}

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
            class="relative col-span-full flex h-[31.5px] cursor-pointer items-center px-[2.25px] py-[2.25px]">
            <div
              class="text-c-2 group-hover:text-c-1 flex h-full w-full items-center justify-start rounded px-1.5">
              <span>{{ contentTypeLabel }}</span>
              <ScalarIcon
                class="text-c-3 ml-1 mt-px"
                icon="ChevronDown"
                size="xs" />
            </div>
            <select
              v-model="contentType"
              class="absolute inset-0 w-auto opacity-0"
              @change="updateActiveBody(contentType)"
              @click.prevent>
              <option
                v-for="(label, value) in contentTypeOptions"
                :key="value"
                :value="value">
                {{ label }}
              </option>
            </select>
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
              <template v-if="activeInstance?.body.binary?.file">
                <span class="text-c-2">{{
                  activeInstance?.body.binary.file.name
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
              class="!m-0 rounded-t-none border-[.5px] border-t-0 shadow-none"
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
              class="!m-0 rounded-t-none border-[.5px] border-t-0 shadow-none"
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
              :modelValue="activeInstance?.body.raw.value ?? ''"
              @change="updateRequestBody" />
          </template>
        </DataTableRow>
        <!-- Hacky... but effective, extra table row to trick the last group -->
        <DataTableRow />
      </DataTable>
    </template>
  </ViewLayoutCollapse>
</template>
