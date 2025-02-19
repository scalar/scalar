<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { ref } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'

import ModeToggleButton from './ModeToggleButton.vue'

const { modelValue } = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<(e: 'update:modelValue', value: string) => void>()

const mode = ref<'edit' | 'preview'>('preview')
</script>

<template>
  <div
    class="mx-auto flex h-full w-full flex-col gap-2 py-6 md:max-h-[82dvh] md:max-w-[50dvw]">
    <div
      class="hover:border-b-3 has-[:focus-visible]:bg-b-1 z-1 group relative flex flex-col overflow-hidden rounded-lg border border-transparent">
      <!-- Tabs -->
      <div
        class="bg-b-1 absolute bottom-4 left-1/2 z-[1] hidden -translate-x-1/2 grid-cols-2 gap-1 rounded-lg p-1 text-sm group-hover:grid">
        <ModeToggleButton v-model="mode" />
        <div
          class="-z-1 bg-b-1 brightness-lifted absolute inset-0 rounded shadow-lg" />
      </div>
      <div class="h-full min-h-48 overflow-y-auto">
        <!-- Preview -->
        <template v-if="mode === 'preview'">
          <ScalarMarkdown
            class="h-full rounded-lg p-1.5"
            :class="{
              'text-c-3 rounded border border-dashed': modelValue === '',
            }"
            :value="modelValue || 'Add description...'"
            @dblclick="mode = 'edit'" />
        </template>

        <!-- Edit -->
        <template v-if="mode === 'edit'">
          <CodeInput
            class="h-full !rounded-lg px-1 py-0"
            :class="{ 'min-h-[calc(1em*4)]': mode === 'edit' }"
            :modelValue="modelValue"
            @blur="mode = 'preview'"
            @update:modelValue="emit('update:modelValue', $event)" />
        </template>
      </div>
      <div
        class="brightness-lifted -z-1 bg-b-1 absolute inset-0 hidden rounded shadow-lg group-hover:block group-has-[:focus-visible]:hidden" />
    </div>
  </div>
</template>
<style scoped>
:deep(.cm-content) {
  min-height: fit-content;
}
</style>
