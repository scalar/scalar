<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import {
  requestExampleParametersSchema,
  type Operation,
  type RequestExample,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { canMethodHaveBody } from '@scalar/oas-utils/helpers'
import type { CodeMirrorLanguage } from '@scalar/use-codemirror'
import type { Entries } from 'type-fest'
import { computed, nextTick, ref, watch } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useFileDialog } from '@/hooks'
import { useWorkspace } from '@/store'
import type { EnvVariable } from '@/store/active-entities'

import RequestTable from './RequestTable.vue'

const { example, operation, environment, envVariables, workspace, title } =
  defineProps<{
    example: RequestExample
    operation: Operation
    environment: Environment
    envVariables: EnvVariable[]
    workspace: Workspace
    title: string
  }>()

const { requestExampleMutators } = useWorkspace()

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
  const { activeBody, formData, raw } = example.body

  // Form
  if (activeBody === 'formData') {
    return formData?.encoding === 'urlencoded'
      ? 'formUrlEncoded'
      : 'multipartForm'
  }
  // Binary
  if (activeBody === 'binary') {
    return 'binaryFile'
  }
  // Raw
  if (activeBody === 'raw' && raw?.encoding) {
    if (raw.encoding === 'html') {
      return 'other'
    }
    return raw.encoding
  }

  // Set content type from request if present
  const contentType = Object.keys(operation.requestBody?.content || {})[0]

  return contentType || 'none'
})
/** Selected ref from options above */
const selectedContentType = computed({
  get: () =>
    contentTypeOptions.find(
      (opt) => opt.id === activeExampleContentType.value,
    ) ??
    contentTypeOptions[contentTypeOptions.length - 1] ??
    contentTypeOptions[0],
  set: (opt) => {
    if (opt?.id) {
      updateActiveBody(opt.id)
    }
  },
})
const tableWrapperRef = ref<HTMLInputElement | null>(null)

const codeInputLanguage = computed(() => {
  const type = selectedContentType.value
    ?.id as keyof typeof contentTypeToLanguageMap
  return contentTypeToLanguageMap[type] ?? 'plaintext'
})

const deleteRow = (rowIdx: number) => {
  const currentParams = formParams.value
  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
    updatedParams.splice(rowIdx, 1)

    requestExampleMutators.edit(
      example.uid,
      'body.formData.value',
      updatedParams,
    )
  }
}

/** Update a field in a parameter row */
const updateRow = (rowIdx: number, field: 'key' | 'value', value: string) => {
  const currentParams = formParams.value

  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
    updatedParams[rowIdx] = {
      ...updatedParams[rowIdx],
      value: updatedParams[rowIdx]?.value || '',
      key: updatedParams[rowIdx]?.key || '',
      enabled: updatedParams[rowIdx]?.enabled ?? false,
      [field]: value || '',
    }

    /** enable row key or value is filled */
    if (
      updatedParams[rowIdx]?.key !== '' ||
      updatedParams[rowIdx]?.value !== ''
    ) {
      updatedParams[rowIdx].enabled = true
    }

    /** check key and value input state */
    if (
      updatedParams[rowIdx]?.key === '' &&
      updatedParams[rowIdx]?.value === ''
    ) {
      /** remove if empty */
      updatedParams.splice(rowIdx, 1)
    }

    requestExampleMutators.edit(
      example.uid,
      'body.formData.value',
      updatedParams,
    )
  } else {
    /** if there is no row at the index, add a new one */
    const payload = [requestExampleParametersSchema.parse({ [field]: value })]

    requestExampleMutators.edit(example.uid, 'body.formData.value', payload)

    /** focus the new row */
    nextTick(() => {
      if (!tableWrapperRef.value) {
        return
      }
      const inputs = tableWrapperRef.value.querySelectorAll('input')
      const inputsIndex = field === 'key' ? 0 : 1
      inputs[inputsIndex]?.focus()
    })
  }

  // Add a new row if the updated row is the last one
  if (rowIdx === currentParams.length - 1) {
    addRow()
  }
}

const formParams = computed(() => example.body.formData?.value ?? [])

/** ensure one empty row by default */
const defaultRow = () => {
  const lastParam = formParams.value[formParams.value.length - 1]
  if (!lastParam || lastParam.key !== '' || lastParam.value !== '') {
    addRow()
  }
}

/** Add a new row to a given parameter list */
const addRow = () => {
  /** Create a new parameter instance with 'enabled' set to false */
  const newParam = requestExampleParametersSchema.parse({
    enabled: false,
  })
  const newParams = [...formParams.value, newParam]

  // Ensure we have formData
  if (example.body.formData) {
    requestExampleMutators.edit(example.uid, 'body.formData.value', newParams)
  } else {
    requestExampleMutators.edit(example.uid, 'body.formData', {
      value: newParams,
      encoding: 'form-data',
    })
  }
}

/** Enable and disables the row */
const toggleRow = (rowIdx: number, enabled: boolean) => {
  const currentParams = formParams.value
  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
    if (updatedParams[rowIdx]) {
      updatedParams[rowIdx].enabled = enabled
    }

    requestExampleMutators.edit(
      example.uid,
      'body.formData.value',
      updatedParams,
    )
  }
}

const updateRequestBody = (value: string) =>
  requestExampleMutators.edit(example.uid, 'body.raw.value', value)

/** Take the select option and return bodyType with encoding and header */
const getBodyType = (type: Content) => {
  if (type === 'multipartForm') {
    return {
      activeBody: 'formData',
      encoding: 'form-data',
      header: 'multipart/form-data',
    } as const
  }
  if (type === 'formUrlEncoded') {
    return {
      activeBody: 'formData',
      encoding: 'urlencoded',
      header: 'application/x-www-form-urlencoded',
    } as const
  }
  if (type === 'binaryFile') {
    return {
      activeBody: 'binary',
      encoding: undefined,
      header: 'application/octet-stream',
    } as const
  }
  if (type === 'json') {
    const contentTypes = Object.keys(operation.requestBody?.content ?? {})

    // Gets json content types including vendor specific ones
    const jsonContentType =
      contentTypes.find((t) => t.includes('json') || t.endsWith('+json')) ||
      'application/json'

    return {
      activeBody: 'raw',
      encoding: 'json',
      header: jsonContentType,
    } as const
  }
  if (type === 'xml') {
    return {
      activeBody: 'raw',
      encoding: 'xml',
      header: 'application/xml',
    } as const
  }
  if (type === 'yaml') {
    return {
      activeBody: 'raw',
      encoding: 'yaml',
      header: 'application/yaml',
    } as const
  }
  if (type === 'edn') {
    return {
      activeBody: 'raw',
      encoding: 'edn',
      header: 'application/edn',
    } as const
  }
  if (type === 'other') {
    return {
      activeBody: 'raw',
      encoding: 'html',
      header: 'application/html',
    } as const
  }

  return { activeBody: 'raw', encoding: undefined, header: undefined } as const
}

/** Set active body AND encoding */
const updateActiveBody = (type: Content) => {
  const { activeBody, encoding, header } = getBodyType(type)
  requestExampleMutators.edit(example.uid, 'body.activeBody', activeBody)

  // Set encoding safely
  if (encoding && activeBody === 'raw') {
    requestExampleMutators.edit(example.uid, 'body.raw', {
      encoding,
      value: example.body.raw?.value ?? '',
    })
  } else if (encoding && activeBody === 'formData') {
    requestExampleMutators.edit(example.uid, 'body.formData', {
      encoding,
      value: example.body.formData?.value ?? [],
    })
  }
  // Remove raw if no encoding and not binary
  else if (!encoding && activeBody !== 'binary') {
    const { raw: deleteMe, ...body } = example.body
    requestExampleMutators.edit(example.uid, 'body', body)
  }

  // Handle headers
  const headers = [...example.parameters.headers]
  const contentTypeIdx = headers.findIndex(
    (h) => h.key.toLowerCase() === 'content-type',
  )

  if (contentTypeIdx >= 0) {
    // Update header if exists
    if (header && headers[contentTypeIdx]) {
      headers[contentTypeIdx].value = header
    }
    // Remove header if we don't want one
    else if (
      headers[contentTypeIdx] &&
      (activeBody !== 'raw' || type === 'none')
    ) {
      headers.splice(contentTypeIdx, 1)
    }
  }
  // Add header if doesn't have one
  else if (header) {
    const lastHeader = headers[headers.length - 1]
    // Add header before last if empty to prevent empty row duplication
    if (lastHeader && lastHeader.key === '' && lastHeader.value === '') {
      headers.splice(headers.length - 1, 0, {
        key: 'Content-Type',
        value: header,
        enabled: true,
      })
    } else {
      headers.push({
        key: 'Content-Type',
        value: header,
        enabled: true,
      })
    }
  }

  requestExampleMutators.edit(example.uid, 'parameters.headers', headers)
}

const handleFileUploadFormData = async (rowIdx: number) => {
  const { open } = useFileDialog({
    onChange: async (files) => {
      const file = files?.[0]
      if (file) {
        const currentParams = formParams.value
        const updatedParams = [...currentParams]
        updatedParams[rowIdx] = {
          ...updatedParams[rowIdx],
          file,
          value: updatedParams[rowIdx]?.value || file.name,
          key: updatedParams[rowIdx]?.key || file.name,
          enabled: true,
        }
        requestExampleMutators.edit(
          example.uid,
          'body.formData.value',
          updatedParams,
        )

        defaultRow()
      }
    },
    multiple: false,
    accept: '*/*',
  })
  open()
}

const removeBinaryFile = () =>
  requestExampleMutators.edit(example.uid, 'body.binary', undefined)

function handleRemoveFileFormData(rowIdx: number) {
  const currentParams = formParams.value
  const updatedParams = [...currentParams]
  const param = currentParams[rowIdx]
  const file = param?.file as File | undefined

  // Empty key value or non updated file name then remove the row
  if (
    currentParams.length > 1 &&
    ((!param?.key && !param?.value) ||
      (file && param?.key === file.name && param?.value === file.name))
  ) {
    updatedParams.splice(rowIdx, 1)
  } else {
    // File name updated then remove file only
    if (updatedParams[rowIdx]) {
      updatedParams[rowIdx].file = undefined
    }
  }
  requestExampleMutators.edit(example.uid, 'body.formData.value', updatedParams)
}

function handleFileUpload() {
  const { open } = useFileDialog({
    onChange: async (files) => {
      const file = files?.[0]
      if (file) {
        requestExampleMutators.edit(example.uid, 'body.binary', file)
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
    if (['multipartForm', 'formUrlEncoded'].includes(val?.id || '')) {
      defaultRow()
    }
  },
  { immediate: true },
)

watch(
  () => example.uid,
  () => {
    operation.method &&
      canMethodHaveBody(operation.method) &&
      updateActiveBody(activeExampleContentType.value as Content)

    // Add extra row on page route change as well
    if (
      ['multipartForm', 'formUrlEncoded'].includes(
        activeExampleContentType.value as Content,
      )
    ) {
      defaultRow()
    }
  },
  { immediate: true },
)

const exampleOptions = computed(() => {
  const contentType = selectedContentType.value?.id
  const { header } = getBodyType(contentType as Content)
  const content = operation.requestBody?.content || {}
  const examples = header ? content[header]?.examples || {} : {}
  return Object.entries(examples).map(([key, value]) => ({
    id: key,
    label: key,
    value,
  }))
})

const selectedExample = computed({
  get: () => {
    const rawValue = example.body.raw?.value ?? '{}'
    const parsedValue = JSON.parse(rawValue)
    const getExample = exampleOptions.value.find((e) => {
      const exampleValue = e.value as {
        value: Record<string, string>
      }
      return JSON.stringify(exampleValue.value) === JSON.stringify(parsedValue)
    })
    return getExample ?? exampleOptions.value[0]
  },
  set: (opt) => {
    if (opt?.id) {
      const exampleOption = exampleOptions.value.find((e) => e.id === opt.id)
      if (exampleOption) {
        const exampleValue = exampleOption.value as {
          value: Record<string, string>
        }
        updateRequestBody(JSON.stringify(exampleValue.value, null, 2))
      }
    }
  },
})
</script>
<template>
  <ViewLayoutCollapse>
    <template #title>{{ title }}</template>
    <DataTable
      :columns="['']"
      presentational>
      <DataTableRow>
        <DataTableHeader
          class="relative col-span-full flex h-8 cursor-pointer items-center justify-between !p-0">
          <ScalarListbox
            v-model="selectedContentType"
            :options="contentTypeOptions"
            teleport>
            <ScalarButton
              class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-3 font-normal"
              fullWidth
              variant="ghost">
              <span>{{ selectedContentType?.label }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="md" />
            </ScalarButton>
          </ScalarListbox>
          <ScalarListbox
            v-if="exampleOptions.length > 0"
            v-model="selectedExample"
            :options="exampleOptions"
            side="left"
            teleport>
            <ScalarButton
              class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-2 font-normal"
              fullWidth
              variant="ghost">
              <span>{{ selectedExample?.label }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="md" />
            </ScalarButton>
          </ScalarListbox>
        </DataTableHeader>
      </DataTableRow>
      <DataTableRow>
        <template v-if="selectedContentType?.id === 'none'">
          <div
            class="text-c-3 flex min-h-10 w-full items-center justify-center border-t p-2 text-sm">
            <span>No Body</span>
          </div>
        </template>
        <template v-else-if="selectedContentType?.id === 'binaryFile'">
          <div
            class="flex items-center justify-center overflow-hidden border-t p-1.5">
            <template v-if="example.body.binary">
              <span
                class="text-c-2 w-full max-w-full overflow-hidden rounded border px-1.5 py-1 text-xs whitespace-nowrap">
                {{ (example.body.binary as File).name }}
              </span>
              <ScalarButton
                class="bg-b-2 hover:bg-b-3 text-c-2 ml-1 border-0 shadow-none"
                size="sm"
                variant="outlined"
                @click="removeBinaryFile">
                Delete
              </ScalarButton>
            </template>
            <template v-else>
              <ScalarButton
                class="bg-b-2 hover:bg-b-3 text-c-2 border-0 shadow-none"
                size="sm"
                variant="outlined"
                @click="handleFileUpload">
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
        <template v-else-if="selectedContentType?.id == 'multipartForm'">
          <RequestTable
            ref="tableWrapperRef"
            class="!m-0 rounded-t-none border-t-0 border-r-0 border-b-0 border-l-0 shadow-none"
            :columns="['32px', '', '', '104px']"
            :envVariables="envVariables"
            :environment="environment"
            :items="formParams"
            showUploadButton
            :workspace="workspace"
            @deleteRow="deleteRow"
            @removeFile="handleRemoveFileFormData"
            @toggleRow="toggleRow"
            @updateRow="updateRow"
            @uploadFile="handleFileUploadFormData" />
        </template>
        <template v-else-if="selectedContentType?.id == 'formUrlEncoded'">
          <RequestTable
            ref="tableWrapperRef"
            class="!m-0 rounded-t-none border-t-0 border-r-0 border-b-0 border-l-0 shadow-none"
            :columns="['32px', '', '', '104px']"
            :envVariables="envVariables"
            :environment="environment"
            :items="formParams"
            showUploadButton
            :workspace="workspace"
            @deleteRow="deleteRow"
            @removeFile="handleRemoveFileFormData"
            @toggleRow="toggleRow"
            @updateRow="updateRow"
            @uploadFile="handleFileUploadFormData" />
        </template>
        <template v-else>
          <!-- TODO: remove this as type hack when we add syntax highligting -->
          <CodeInput
            class="border-t px-1"
            content=""
            :envVariables="envVariables"
            :environment="environment"
            :language="codeInputLanguage as CodeMirrorLanguage"
            lineNumbers
            lint
            :modelValue="example.body?.raw?.value ?? ''"
            :workspace="workspace"
            @update:modelValue="updateRequestBody" />
        </template>
      </DataTableRow>
      <!-- Hacky... but effective, extra table row to trick the last group -->
      <DataTableRow />
    </DataTable>
  </ViewLayoutCollapse>
</template>
<style scoped>
:deep(.cm-content) {
  font-size: var(--scalar-small);
}
</style>
