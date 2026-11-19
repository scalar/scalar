<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarCheckboxInput } from '@scalar/components/checkbox-input'
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconPlus, ScalarIconUpload, ScalarIconX } from '@scalar/icons'
import { computed, nextTick, useTemplateRef } from 'vue'

import { useLocalization } from '@/v2/features/localization'

/** A selected multipart file and its position in the underlying form rows. */
export type RequestTableFile = {
  file: File
  index: number
  isDisabled: boolean
}

const {
  name,
  files,
  disabled = false,
} = defineProps<{
  name: string
  files: RequestTableFile[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  uploadFile: []
  removeFile: [index: number]
  updateFile: [index: number, isDisabled: boolean]
}>()

const { translate } = useLocalization()
const uploadLabel = computed<string>(() =>
  translate(
    files.length
      ? 'apiClient.requestTableRow.addFiles'
      : 'apiClient.requestTableRow.selectFiles',
  ),
)
const root = useTemplateRef('root')

defineExpose({
  focusUpload: (): void =>
    root.value
      ?.querySelector<HTMLButtonElement>('[data-upload-files]')
      ?.focus(),
})

const handleRemove = async (index: number, position: number): Promise<void> => {
  emit('removeFile', index)
  await nextTick()
  // Removing a focused button should keep keyboard navigation inside the file field.
  const remaining =
    root.value?.querySelectorAll<HTMLButtonElement>('[data-remove-file]')
  const next = remaining?.[Math.min(position, remaining.length - 1)]
  const target =
    next ?? root.value?.querySelector<HTMLButtonElement>('[data-upload-files]')
  target?.focus()
}
</script>

<template>
  <div
    ref="root"
    class="flex min-w-0 flex-1 flex-col p-1">
    <ul
      v-if="files.length"
      :aria-label="name"
      class="m-0 flex list-none flex-col p-0">
      <li
        v-for="(item, position) in files"
        :key="item.index"
        class="flex min-w-0 items-center gap-1">
        <ScalarCheckboxInput
          :aria-label="
            translate('apiClient.requestTableRow.include', {
              name: `${name}: ${item.file.name}`,
            })
          "
          class="has-[:focus-visible]:outline-c-accent min-h-7 min-w-0 flex-1 rounded border-0 px-1 py-0 shadow-none has-[:focus-visible]:outline"
          :disabled="disabled"
          :modelValue="!item.isDisabled"
          @update:modelValue="
            (enabled) => emit('updateFile', item.index, !enabled)
          ">
          <span
            :class="{ 'text-c-3': item.isDisabled }"
            :title="item.file.name"
            >{{ item.file.name }}</span
          >
        </ScalarCheckboxInput>
        <ScalarIconButton
          data-remove-file
          :disabled="disabled"
          :icon="ScalarIconX"
          :label="
            translate('apiClient.requestTableRow.removeFile', {
              name: item.file.name,
              field: name,
            })
          "
          size="sm"
          variant="ghost"
          @click="handleRemove(item.index, position)" />
      </li>
    </ul>
    <div class="flex items-center gap-1">
      <ScalarButton
        :aria-label="
          translate('apiClient.requestTableRow.uploadFor', {
            action: uploadLabel,
            name: name || translate('apiClient.requestTableRow.row'),
          })
        "
        class="text-c-2 h-7 px-1"
        data-upload-files
        :disabled="disabled"
        :icon="files.length ? ScalarIconPlus : ScalarIconUpload"
        size="sm"
        variant="ghost"
        @click="emit('uploadFile')">
        {{ uploadLabel }}
      </ScalarButton>
      <slot />
    </div>
  </div>
</template>
