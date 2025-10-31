<script setup lang="ts">
import { ScalarButton, ScalarMarkdown } from '@scalar/components'
import { ScalarIconPencil } from '@scalar/icons'
import {
  computed,
  nextTick,
  ref,
  useTemplateRef,
  type ComputedRef,
  type Ref,
} from 'vue'

import { CodeInput } from '@/v2/components/code-input'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'

const { environment, document, eventBus, layout } =
  defineProps<CollectionProps>()

const description: ComputedRef<string> = computed(
  () => document?.info?.description ?? '',
)

const mode: Ref<'edit' | 'preview'> = ref('preview')

const codeInputRef = useTemplateRef('codeInputRef')

/**
 * Switch between edit and preview modes.
 * When switching to edit mode, focus the input after the DOM updates.
 */
const switchMode = async (newMode: 'edit' | 'preview'): Promise<void> => {
  setTimeout(() => {
    mode.value = newMode
    // if (newMode === 'edit') {
    //   await nextTick()
    //   codeInputRef.value?.focus()
    // }
  }, 100)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2 pl-1.5">
      <h3 class="font-bold">Description</h3>

      <ScalarButton
        v-if="mode === 'preview'"
        class="text-c-2 hover:text-c-1 flex items-center gap-2"
        size="sm"
        type="button"
        variant="outlined"
        @click="switchMode('edit')">
        <ScalarIconPencil
          size="sm"
          thickness="1.5" />
        <span>Edit</span>
      </ScalarButton>
    </div>
    <div class="has-[:focus-visible]:bg-b-1 group rounded-lg">
      <!-- Preview -->
      <template v-if="mode === 'preview'">
        <template v-if="description.trim().length">
          <ScalarMarkdown
            class="flex-1 rounded border border-transparent p-1.5 hover:border-(--scalar-background-3)"
            :value="description"
            withImages
            @dblclick="switchMode('edit')" />
          <div
            class="brightness-lifted bg-b-1 absolute inset-0 -z-1 hidden rounded group-hover:block group-has-[:focus-visible]:hidden" />
        </template>

        <div
          v-else
          class="text-c-3 flex items-center justify-center rounded-lg border p-4">
          <ScalarButton
            class="hover:bg-b-2 hover:text-c-1 text-c-2 flex items-center gap-2"
            size="sm"
            variant="ghost"
            @click="switchMode('edit')">
            <ScalarIconPencil
              size="sm"
              thickness="1.5" />
            <span>Write a description</span>
          </ScalarButton>
        </div>
      </template>

      <!-- Edit -->
      <template v-else>
        <CodeInput
          ref="codeInputRef"
          class="border px-0.5 py-0"
          :environment="undefined"
          :layout="layout"
          :modelValue="description"
          @blur="switchMode('preview')"
          @update:modelValue="
            (description) =>
              eventBus.emit('document:update:info', { description })
          " />
      </template>
    </div>
  </div>
</template>

<style scoped>
:deep(.cm-content) {
  min-height: fit-content;
}
:deep(.cm-scroller) {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
