<script setup lang="ts">
import {
  ScalarButton,
  ScalarLoading,
  ScalarToggle,
  type LoadingState,
} from '@scalar/components'
import { computed } from 'vue'

const { isAutoSaveEnabled, isDirty, saveLoader } = defineProps<{
  isAutoSaveEnabled: boolean
  isDirty: boolean
  saveLoader: LoadingState
}>()

const emit = defineEmits<{
  (e: 'update:isAutoSaveEnabled', value: boolean): void
  (e: 'saveNow'): void
}>()

const editorStatusText = computed(() => {
  if (!isAutoSaveEnabled && isDirty) {
    return 'Unsaved'
  }

  if (!saveLoader.isActive) {
    return null
  }
  if (saveLoader.isLoading) {
    return 'Saving…'
  }
  if (saveLoader.isInvalid) {
    return 'Save failed'
  }
  if (saveLoader.isValid) {
    return 'Saved'
  }
  return null
})

const shouldShowEditorStatus = computed(() => editorStatusText.value !== null)

const editorStatusTone = computed<
  'warning' | 'loading' | 'success' | 'danger' | null
>(() => {
  if (!shouldShowEditorStatus.value) {
    return null
  }

  if (!isAutoSaveEnabled && isDirty) {
    return 'warning'
  }

  if (saveLoader.isLoading) {
    return 'loading'
  }
  if (saveLoader.isInvalid) {
    return 'danger'
  }
  if (saveLoader.isValid) {
    return 'success'
  }

  return null
})

const editorStatusDotClass = computed(() => {
  switch (editorStatusTone.value) {
    case 'warning':
      return 'bg-c-alert'
    case 'success':
      return 'bg-c-accent'
    case 'danger':
      return 'bg-c-danger'
    default:
      return 'bg-b-3'
  }
})

const editorStatusTextClass = computed(() => {
  switch (editorStatusTone.value) {
    case 'warning':
      return 'text-c-alert'
    case 'success':
      return 'text-c-accent'
    case 'danger':
      return 'text-c-danger'
    default:
      return 'text-c-2'
  }
})
</script>

<template>
  <div
    class="bg-b-1 pointer-events-auto flex flex-col items-stretch overflow-hidden rounded-lg border shadow-sm">
    <div class="flex items-center gap-2 px-2 py-1.5">
      <span class="text-c-2 text-[11px] font-medium whitespace-nowrap">
        Auto-save
      </span>
      <ScalarToggle
        :modelValue="isAutoSaveEnabled"
        @update:modelValue="emit('update:isAutoSaveEnabled', $event)" />

      <div class="bg-b-3 mx-1 h-4 w-px" />

      <div class="min-w-[48px]">
        <ScalarButton
          v-if="!isAutoSaveEnabled"
          :disabled="!isDirty || saveLoader.isLoading"
          size="xs"
          variant="outlined"
          @click="emit('saveNow')">
          Save
        </ScalarButton>
        <div
          v-else
          class="text-c-3 flex h-6 items-center justify-center rounded px-2 text-[11px] whitespace-nowrap">
          Auto
        </div>
      </div>
    </div>

    <div
      v-if="shouldShowEditorStatus"
      class="bg-b-2/40 flex items-center gap-2 border-t px-2 py-1 text-[11px]">
      <ScalarLoading
        v-if="saveLoader.isActive"
        class="self-center"
        :loader="saveLoader"
        size="sm" />
      <span
        v-else
        class="size-1.5 rounded-full"
        :class="editorStatusDotClass" />

      <span
        class="whitespace-nowrap"
        :class="editorStatusTextClass">
        {{ editorStatusText }}
      </span>
    </div>
  </div>
</template>
