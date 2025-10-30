<script setup lang="ts">
import { ScalarButton, ScalarMarkdown } from '@scalar/components'
import { ScalarIconPencil } from '@scalar/icons'
import { computed, nextTick, ref, useTemplateRef } from 'vue'

import { CodeInput } from '@/v2/components/code-input'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'

const { environment, document, eventBus } = defineProps<CollectionProps>()

const description = computed(() => document?.info?.description ?? '')

const mode = ref<'edit' | 'preview'>('preview')

const switchMode = async (newMode: 'edit' | 'preview') => {
  mode.value = newMode

  if (newMode === 'edit') {
    await nextTick(() => {
      // Focus the input after switching to edit mode
      codeInputRef.value?.focus()
    })
  }
}

const codeInputRef = useTemplateRef('codeInputRef')
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex min-h-8 items-center justify-between gap-2 pl-1.5">
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
    <div
      class="has-[:focus-visible]:bg-b-1 group relative z-1 flex flex-col rounded-lg">
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
      <template v-if="mode === 'edit'">
        <CodeInput
          ref="codeInputRef"
          class="border px-0.5 py-0"
          :environment="environment"
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
