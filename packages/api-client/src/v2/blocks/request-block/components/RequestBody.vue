<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import { CONTENT_TYPES } from '@scalar/helpers/consts/content-types'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { useFileDialog } from '@/hooks'
import { getSelectedBodyContentType } from '@/v2/blocks/operation-block/helpers/get-selected-body-content-type'
import { getResolvedRefDeep } from '@/v2/blocks/operation-code-sample/helpers/get-resolved-ref-deep'
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

/** Selected content type with default */
const selectedContentType = computed(
  () => getSelectedBodyContentType(requestBody, exampleKey) ?? 'none',
)

/** Convert content types to options for the dropdown */
const contentTypeOptions = objectEntries(CONTENT_TYPES).map(([id, label]) => ({
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

/** Request body examples for the selected content type (from OpenAPI spec) */
const bodyExampleOptions = computed<ScalarListboxOption[]>(() => {
  const contentType = selectedContentType.value
  const mediaType = requestBody?.content?.[contentType]
  if (!mediaType) {
    return []
  }
  const content = getResolvedRef(mediaType) as {
    examples?: Record<string, { value?: unknown; summary?: string }>
  }
  const examples = content?.examples
  if (!examples || Object.keys(examples).length === 0) {
    return []
  }
  return Object.entries(examples).map(([key, ex]) => ({
    id: key,
    label: (getResolvedRefDeep(ex) as { summary?: string })?.summary ?? key,
  }))
})

/** Selected body example - matches current value to examples, or first if no match */
const selectedBodyExample = computed<ScalarListboxOption | undefined>({
  get: () => {
    const options = bodyExampleOptions.value
    if (options.length === 0) {
      return undefined
    }
    const currentValue = bodyValue.value
    const content = getResolvedRef(
      requestBody?.content?.[selectedContentType.value],
    ) as { examples?: Record<string, { value?: unknown }> }
    const examples = content?.examples
    if (!examples) {
      return options[0]
    }
    for (const opt of options) {
      const ex = getResolvedRefDeep(examples[opt.id]) as { value?: unknown }
      const exValue = ex?.value
      const exStr =
        typeof exValue === 'string'
          ? exValue
          : JSON.stringify(exValue ?? null, null, 2)
      if (exStr === currentValue) {
        return opt
      }
    }
    return options[0]
  },
  set: (opt) => {
    if (!opt?.id || !requestBody?.content) {
      return
    }
    const content = getResolvedRef(
      requestBody.content[selectedContentType.value],
    ) as { examples?: Record<string, { value?: unknown }> }
    const ex = content?.examples?.[opt.id]
    if (!ex) {
      return
    }
    const resolved = getResolvedRefDeep(ex) as { value?: unknown }
    const value = resolved?.value
    const payload =
      typeof value === 'string' ? value : JSON.stringify(value ?? null, null, 2)
    emits('update:value', {
      payload,
      contentType: selectedContentType.value,
    })
  },
})
</script>
<template>
  <CollapsibleSection>
    <template #title>{{ title }}</template>
    <DataTable
      :columns="['']"
      presentational>
      <DataTableHeader
        class="relative col-span-full flex h-8 cursor-pointer items-center justify-between gap-2 border-r-0 !p-0">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <ScalarListbox
            v-model="selectedContentTypeModel"
            :options="contentTypeOptions"
            teleport>
            <ScalarButton
              class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-3 font-normal"
              fullWidth
              variant="ghost">
              <span>{{
                CONTENT_TYPES[
                  selectedContentType as keyof typeof CONTENT_TYPES
                ] ?? selectedContentType
              }}</span>
              <ScalarIcon
                icon="ChevronDown"
                size="md" />
            </ScalarButton>
          </ScalarListbox>
          <ScalarListbox
            v-if="bodyExampleOptions.length > 0"
            v-model="selectedBodyExample"
            class="w-fit min-w-32"
            :options="bodyExampleOptions"
            placement="bottom-start"
            teleport>
            <ScalarButton
              class="text-c-2 hover:text-c-1 flex h-full w-fit min-w-0 gap-1.5 px-1.5 py-0.75 text-base font-normal"
              data-testid="example-picker"
              variant="ghost">
              <div class="min-w-0 flex-1 truncate">
                {{ selectedBodyExample?.label ?? 'Select an example' }}
              </div>
              <ScalarIconCaretDown
                class="ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100"
                weight="bold" />
            </ScalarButton>
          </ScalarListbox>
        </div>
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
