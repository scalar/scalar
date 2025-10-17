<script setup lang="ts">
import { ScalarButton, ScalarMarkdown } from '@scalar/components'
import { ScalarIconPencil } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { nextTick, ref, useTemplateRef } from 'vue'

import { CodeInput } from '@/components/CodeInput'
import type { EnvVariable } from '@/store'

const { description } = defineProps<{
  description: string

  // ------- To be removed -------
  environment: Environment
  envVariables: EnvVariable[]
}>()

const emit = defineEmits<{
  (e: 'overview:update:description', value: string): void
}>()

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
      <div class="flex h-full min-h-[calc(1rem*4)] flex-col">
        <!-- Preview -->
        <template v-if="mode === 'preview'">
          <template v-if="description && description.trim().length">
            <ScalarMarkdown
              v-if="description"
              class="h-full flex-1 rounded border border-transparent p-1.5 hover:border-(--scalar-background-3)"
              :value="description"
              withImages
              @dblclick="switchMode('edit')" />
            <div
              class="brightness-lifted bg-b-1 absolute inset-0 -z-1 hidden rounded group-hover:block group-has-[:focus-visible]:hidden" />
          </template>
          <div
            v-else
            class="text-c-3 flex h-full items-center justify-center rounded-lg border p-4">
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
            class="h-full flex-1 border px-0.5 py-0"
            :envVariables="envVariables"
            :environment="environment"
            :modelValue="description"
            @blur="switchMode('preview')"
            @update:modelValue="
              (value) => emit('overview:update:description', value)
            " />
        </template>
      </div>
    </div>
  </div>
</template>
