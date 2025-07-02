<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarMarkdown } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { nextTick, ref, watch } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import type { EnvVariable } from '@/store/active-entities'

const { modelValue, environment, envVariables, workspace } = defineProps<{
  modelValue: string
  environment: Environment
  envVariables: EnvVariable[]
  workspace: Workspace
}>()

const emit = defineEmits<(e: 'update:modelValue', value: string) => void>()

const mode = ref<'edit' | 'preview'>('preview')

const codeInputRef = ref<InstanceType<typeof CodeInput> | null>(null)

watch(mode, (newMode) => {
  if (newMode === 'edit') {
    nextTick(() => {
      codeInputRef.value?.focus()
    })
  }
})

const handleBlur = () => {
  // Delay mode switch until after DOM updates to avoid input typing issue
  requestAnimationFrame(() => {
    mode.value = 'preview'
  })
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-2 pt-8">
    <div class="flex min-h-8 items-center justify-between gap-2 pl-1.5">
      <h3 class="font-bold">Description</h3>
      <ScalarButton
        v-if="mode === 'preview'"
        class="text-c-2 hover:text-c-1 flex items-center gap-2"
        size="sm"
        type="button"
        variant="outlined"
        @click="mode = 'edit'">
        <ScalarIcon
          icon="Pencil"
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
          <template v-if="modelValue && modelValue.trim().length">
            <ScalarMarkdown
              v-if="modelValue"
              class="h-full flex-1 rounded border border-transparent p-1.5 hover:border-(--scalar-background-3)"
              :value="modelValue"
              withImages
              @dblclick="mode = 'edit'" />
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
              @click="mode = 'edit'">
              <ScalarIcon
                icon="Pencil"
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
            :modelValue="modelValue"
            :workspace="workspace"
            @blur="handleBlur"
            @update:modelValue="emit('update:modelValue', $event)" />
        </template>
      </div>
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
