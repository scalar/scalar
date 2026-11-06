<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { isObject } from '@scalar/helpers/object/is-object'
import { resolveFormSchema } from '@scalar/workspace-store/helpers/resolve-form-schema'
import {
  coerceLeafValueToSchemaType,
  getExampleFromSchema,
  getMultipartItemSchema,
} from '@scalar/workspace-store/request-example'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import {
  isArraySchema,
  isObjectSchema,
} from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'
import { computed, ref, shallowRef, watch } from 'vue'

import { useFileDialog } from '@/hooks/use-file-dialog'
import {
  getMultipartBodyParts,
  updateMultipartBodyPart,
  type MultipartBodyPart,
  type MultipartBodyValue,
} from '@/v2/blocks/request-block/helpers/multipart-body'
import { useLocalization } from '@/v2/features/localization'

const { value, media, compositionSelection } = defineProps<{
  value: MultipartBodyValue
  media: MediaTypeObject
  compositionSelection?: Record<string, number>
}>()
const emit = defineEmits<{
  'update:value': [value: MultipartBodyValue]
}>()
const { translate } = useLocalization()
const localValue = shallowRef<MultipartBodyValue>(value)
const drafts = ref<Record<string, string>>({})
const errors = ref<Record<string, boolean>>({})

watch(
  () => value,
  (next) => {
    if (next !== localValue.value) {
      drafts.value = {}
      errors.value = {}
      localValue.value = next
    }
  },
)

const parts = computed<
  (MultipartBodyPart & {
    id: string
    label: string
    text: string | undefined
    filename: string | undefined
  })[]
>(() =>
  getMultipartBodyParts(localValue.value, media, compositionSelection).map(
    (part) => ({
      ...part,
      id: JSON.stringify(part.path),
      label: part.path.every((segment) => typeof segment === 'number')
        ? translate('apiClient.requestBody.part', {
            number: part.path.map((segment) => Number(segment) + 1).join('.'),
          })
        : part.path
            .map((segment) =>
              typeof segment === 'number' ? segment + 1 : segment,
            )
            .join(' / '),
      text:
        typeof part.value === 'string'
          ? part.value
          : part.value == null
            ? ''
            : JSON.stringify(part.value, null, 2),
      filename: part.value instanceof File ? part.value.name : undefined,
    }),
  ),
)
const canAddPart = computed<boolean>(() => {
  const schema = resolveFormSchema(media.schema, compositionSelection)
  return (
    Array.isArray(localValue.value) &&
    !(
      schema &&
      'maxItems' in schema &&
      schema.maxItems !== undefined &&
      localValue.value.length >= schema.maxItems
    )
  )
})

const updatePart = (part: MultipartBodyPart, next: unknown): void => {
  localValue.value = updateMultipartBodyPart(localValue.value, part.path, next)
  emit('update:value', localValue.value)
}
const editPart = (part: MultipartBodyPart, text: string): void => {
  const id = JSON.stringify(part.path)
  drafts.value[id] = text
  try {
    const structured =
      Array.isArray(part.value) ||
      isObject(part.value) ||
      (part.schema &&
        (isObjectSchema(part.schema) || isArraySchema(part.schema)))
    const next = structured
      ? JSON.parse(text)
      : coerceLeafValueToSchemaType(text, part.schema)
    errors.value[id] = false
    updatePart(part, next)
  } catch {
    errors.value[id] = true
  }
}
const uploadFile = (part: MultipartBodyPart): void => {
  const { open } = useFileDialog({
    multiple: false,
    accept: '*/*',
    onChange: (files) => {
      const file = files?.[0]
      if (file) {
        delete drafts.value[JSON.stringify(part.path)]
        delete errors.value[JSON.stringify(part.path)]
        updatePart(part, file)
      }
    },
  })
  void open()
}
const removeFile = (part: MultipartBodyPart): void => {
  delete drafts.value[JSON.stringify(part.path)]
  updatePart(part, '')
}
const addPart = (): void => {
  if (!Array.isArray(localValue.value) || !canAddPart.value) {
    return
  }
  const schema = getMultipartItemSchema(
    resolveFormSchema(media.schema, compositionSelection),
    localValue.value.length,
    media.itemSchema,
  )
  const next = schema ? getExampleFromSchema(schema, { mode: 'write' }) : ''
  localValue.value = [...localValue.value, next ?? '']
  emit('update:value', localValue.value)
}
</script>

<template>
  <div class="min-w-0 border-t">
    <div
      v-for="part in parts"
      :key="part.id"
      class="flex min-w-0 flex-col gap-2 border-b p-3">
      <div class="text-c-2 flex items-center justify-between gap-2 text-xs">
        <span>{{ part.label }}</span>
        <span
          v-if="part.contentType"
          class="truncate"
          >{{ part.contentType }}</span
        >
      </div>
      <div
        v-if="part.filename !== undefined"
        class="flex items-center justify-between gap-2">
        <span class="text-c-1 truncate text-sm">{{ part.filename }}</span>
        <ScalarButton
          :aria-label="`${translate('apiClient.requestBody.delete')} ${part.label}`"
          size="sm"
          variant="outlined"
          @click="removeFile(part)">
          {{ translate('apiClient.requestBody.delete') }}
        </ScalarButton>
      </div>
      <template v-else>
        <textarea
          :aria-invalid="errors[part.id] || undefined"
          :aria-label="part.label"
          class="text-c-1 bg-b-1 font-code min-h-16 w-full resize-y rounded border p-2 text-xs"
          :value="drafts[part.id] ?? part.text"
          @input="
            editPart(part, ($event.target as HTMLTextAreaElement).value)
          " />
        <div
          v-if="errors[part.id]"
          class="text-red text-xs"
          role="alert">
          {{ translate('apiClient.requestBody.invalidPart') }}
        </div>
        <ScalarButton
          v-if="part.canUpload"
          :aria-label="`${translate('apiClient.requestBody.selectFile')} ${part.label}`"
          class="self-start"
          size="sm"
          variant="outlined"
          @click="uploadFile(part)">
          {{ translate('apiClient.requestBody.selectFile') }}
        </ScalarButton>
      </template>
    </div>
    <ScalarButton
      v-if="canAddPart"
      class="m-3"
      size="sm"
      variant="outlined"
      @click="addPart">
      {{ translate('apiClient.requestBody.addPart') }}
    </ScalarButton>
  </div>
</template>
