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
</script>

<template>
  <div
    class="mx-auto flex h-full w-full flex-col gap-2 py-6 md:max-h-[82dvh] md:max-w-[50dvw]">
    <div
      class="has-[:focus-visible]:bg-b-1 z-1 group relative flex flex-col overflow-hidden rounded-lg">
      <div class="h-full min-h-[calc(1rem*4)] overflow-y-auto">
        <!-- Preview -->
        <template v-if="mode === 'preview'">
          <template v-if="modelValue">
            <ScalarMarkdown
              v-if="modelValue"
              class="hover:border-b-3 h-full rounded-lg border border-transparent p-1.5"
              :value="modelValue"
              @dblclick="mode = 'edit'" />
            <div
              class="brightness-lifted -z-1 bg-b-1 absolute inset-0 hidden rounded shadow-lg group-hover:block group-has-[:focus-visible]:hidden" />
          </template>
          <div
            v-else
            class="text-c-3 flex h-full items-center justify-center rounded-lg border p-4">
            <ScalarButton
              class="hover:bg-b-2 hover:text-c-1 text-c-2 flex items-center gap-2"
              variant="ghost"
              size="sm"
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
            class="h-full !rounded-lg border px-1 py-0"
            :modelValue="modelValue"
            :environment="environment"
            :envVariables="envVariables"
            :workspace="workspace"
            @blur="mode = 'preview'"
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
</style>
