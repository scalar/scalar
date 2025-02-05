<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import DataTableHeader from '@/components/DataTable/DataTableHeader.vue'
import DataTableRow from '@/components/DataTable/DataTableRow.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useFileDialog } from '@/hooks'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { requestExampleParametersSchema } from '@scalar/oas-utils/entities/spec'
import { canMethodHaveBody } from '@scalar/oas-utils/helpers'
import type { CodeMirrorLanguage } from '@scalar/use-codemirror'
import type { Entries } from 'type-fest'
import { computed, nextTick, ref, watch } from 'vue'

import RequestTable from './RequestTable.vue'

defineProps<{
  title: string
}>()

const { activeRequest, activeExample } = useActiveEntities()
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
  if (!activeExample.value) return 'none'

  // Form
  if (activeExample.value.body.activeBody === 'formData')
    return activeExample.value.body.formData?.encoding === 'urlencoded'
      ? 'formUrlEncoded'
      : 'multipartForm'
  // Binary
  else if (activeExample.value.body.activeBody === 'binary') return 'binaryFile'
  // Raw
  else if (
    activeExample.value.body.activeBody === 'raw' &&
    activeExample.value.body.raw?.encoding
  ) {
    if (activeExample.value.body.raw.encoding === 'html') return 'other'
    return activeExample.value.body.raw.encoding
  }

  // Set content type from request if present
  const contentType = Object.keys(
    activeRequest.value?.requestBody?.content || {},
  )[0]

  return contentType || 'none'
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
    ?.id as keyof typeof contentTypeToLanguageMap
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

  // Add a new row if the updated row is the last one
  if (rowIdx === currentParams.length - 1) {
    addRow()
  }
}

const formParams = computed(
  () => activeExample.value?.body?.formData?.value ?? [],
)

/** ensure one empty row by default */
const defaultRow = () => {
  const lastParam = formParams.value[formParams.value.length - 1]
  if (!lastParam || lastParam.key !== '' || lastParam.value !== '') {
    addRow()
  }
}

/** Add a new row to a given parameter list */
const addRow = () => {
  if (!activeRequest.value || !activeExample.value) return

  /** Create a new parameter instance with 'enabled' set to false */
  const newParam = requestExampleParametersSchema.parse({
    enabled: false,
  })
  const newParams = [...formParams.value, newParam]

  // Ensure we have formData
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
    if (updatedParams[rowIdx]) {
      updatedParams[rowIdx].enabled = enabled
    }

    requestExampleMutators.edit(
      activeExample.value.uid,
      'body.formData.value',
      updatedParams,
    )
  }
}

const updateRequestBody = (value: string) => {
  if (!activeRequest.value || !activeExample.value) return

  requestExampleMutators.edit(activeExample.value.uid, 'body.raw.value', value)
}

/** Take the select option and return bodyType with encoding and header */
const getBodyType = (type: Content) => {
  if (type === 'multipartForm')
    return {
      activeBody: 'formData',
      encoding: 'form-data',
      header: 'multipart/form-data',
    } as const
  if (type === 'formUrlEncoded')
    return {
      activeBody: 'formData',
      encoding: 'urlencoded',
      header: 'application/x-www-form-urlencoded',
    } as const
  if (type === 'binaryFile')
    return {
      activeBody: 'binary',
      encoding: undefined,
      header: 'application/octet-stream',
    } as const
  if (type === 'json')
    return {
      activeBody: 'raw',
      encoding: 'json',
      header: 'application/json',
    } as const
  if (type === 'xml')
    return {
      activeBody: 'raw',
      encoding: 'xml',
      header: 'application/xml',
    } as const
  if (type === 'yaml')
    return {
      activeBody: 'raw',
      encoding: 'yaml',
      header: 'application/yaml',
    } as const
  if (type === 'edn')
    return {
      activeBody: 'raw',
      encoding: 'edn',
      header: 'application/edn',
    } as const
  if (type === 'other')
    return {
      activeBody: 'raw',
      encoding: 'html',
      header: 'application/html',
    } as const

  return { activeBody: 'raw', encoding: undefined, header: undefined } as const
}

/** Set active body AND encoding */
const updateActiveBody = (type: Content) => {
  if (!activeExample.value) return

  const { activeBody, encoding, header } = getBodyType(type)
  requestExampleMutators.edit(
    activeExample.value.uid,
    'body.activeBody',
    activeBody,
  )

  // Set encoding safely
  if (encoding && activeBody === 'raw') {
    requestExampleMutators.edit(activeExample.value.uid, 'body.raw', {
      encoding,
      value: activeExample.value.body.raw?.value ?? '',
    })
  } else if (encoding && activeBody === 'formData')
    requestExampleMutators.edit(activeExample.value.uid, `body.formData`, {
      encoding,
      value: activeExample.value.body.formData?.value ?? [],
    })
  // Remove raw if no encoding and not binary
  else if (!encoding && activeBody !== 'binary') {
    const { raw: deleteMe, ...body } = activeExample.value.body
    requestExampleMutators.edit(activeExample.value.uid, 'body', body)
  }

  // Handle headers
  const headers = [...activeExample.value.parameters.headers]
  const contentTypeIdx = headers.findIndex(
    (h) => h.key.toLowerCase() === 'content-type',
  )

  if (contentTypeIdx >= 0) {
    // Update header if exists
    if (header && headers[contentTypeIdx]) {
      headers[contentTypeIdx].value = header
    }
    // Remove header if we don't want one
    else if (headers[contentTypeIdx]) {
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

  requestExampleMutators.edit(
    activeExample.value.uid,
    'parameters.headers',
    headers,
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
          value: updatedParams[rowIdx]?.value || file.name,
          key: updatedParams[rowIdx]?.key || file.name,
          enabled: true,
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
    value: '',
    key: '',
    enabled: false,
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
    if (['multipartForm', 'formUrlEncoded'].includes(val?.id || ''))
      defaultRow()
  },
  { immediate: true },
)

watch(
  () => activeExample.value?.uid,
  () => {
    activeRequest.value?.method &&
      canMethodHaveBody(activeRequest.value.method) &&
      updateActiveBody(activeExampleContentType.value as Content)

    // Add extra row on page route change as well
    if (
      ['multipartForm', 'formUrlEncoded'].includes(
        activeExampleContentType.value as Content,
      )
    )
      defaultRow()
  },
  { immediate: true },
)

const exampleOptions = computed(() => {
  const contentType = selectedContentType.value?.id
  const { header } = getBodyType(contentType as Content)
  const content = activeRequest.value?.requestBody?.content || {}
  const examples = header ? content[header]?.examples || {} : {}
  return Object.entries(examples).map(([key, example]) => ({
    id: key,
    label: key,
    value: example,
  }))
})

const selectedExample = computed({
  get: () => {
    const rawValue = activeExample.value?.body.raw?.value ?? '{}'
    const parsedValue = JSON.parse(rawValue)
    const getExample = exampleOptions.value.find((example) => {
      const exampleValue = example.value as {
        value: Record<string, string>
      }
      return JSON.stringify(exampleValue.value) === JSON.stringify(parsedValue)
    })
    return getExample ?? exampleOptions.value[0]
  },
  set: (opt) => {
    if (opt?.id) {
      const exampleOption = exampleOptions.value.find(
        (example) => example.id === opt.id,
      )
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
    <DataTable :columns="['']">
      <DataTableRow>
        <DataTableHeader
          class="relative col-span-full flex h-8 cursor-pointer items-center justify-between !p-0">
          <ScalarListbox
            v-model="selectedContentType"
            :options="contentTypeOptions"
            teleport>
            <ScalarButton
              class="flex gap-1.5 h-full px-3 text-c-2 font-normal hover:text-c-1 w-fit"
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
              class="flex gap-1.5 h-full px-2 text-c-2 font-normal hover:text-c-1 w-fit"
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
            class="border-t-1/2 text-c-3 flex min-h-10 w-full items-center justify-center p-2 text-sm">
            <span>No Body</span>
          </div>
        </template>
        <template v-else-if="selectedContentType?.id === 'binaryFile'">
          <div
            class="border-t flex items-center justify-center p-1.5 overflow-hidden">
            <template v-if="activeExample?.body.binary">
              <span
                class="text-c-2 text-xs w-full border rounded py-1 px-1.5 max-w-full overflow-hidden whitespace-nowrap">
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
        <template v-else-if="selectedContentType?.id == 'multipartForm'">
          <RequestTable
            ref="tableWrapperRef"
            class="!m-0 rounded-t-none shadow-none border-l-0 border-r-0 border-t-0 border-b-0"
            :columns="['32px', '', '', '61px']"
            :items="formParams"
            showUploadButton
            @deleteRow="deleteRow"
            @removeFile="handleRemoveFileFormData"
            @toggleRow="toggleRow"
            @updateRow="updateRow"
            @uploadFile="handleFileUploadFormData" />
        </template>
        <template v-else-if="selectedContentType?.id == 'formUrlEncoded'">
          <RequestTable
            ref="tableWrapperRef"
            class="!m-0 rounded-t-none border-t-0 shadow-none border-l-0 border-r-0 border-t-0 border-b-0"
            :columns="['32px', '', '', '61px']"
            :items="formParams"
            showUploadButton
            @deleteRow="deleteRow"
            @removeFile="handleRemoveFileFormData"
            @toggleRow="toggleRow"
            @updateRow="updateRow"
            @uploadFile="handleFileUploadFormData" />
        </template>
        <template v-else>
          <!-- TODO: remove this as type hack when we add syntax highligting -->
          <CodeInput
            class="border-t-1/2 px-1"
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
  </ViewLayoutCollapse>
</template>
<style scoped>
:deep(.cm-content) {
  font-size: var(--scalar-mini);
}
</style>
