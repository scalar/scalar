<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import { ScalarMarkdown, cva, cx } from '@scalar/components'
import { ref, watch } from 'vue'

const { modelValue } = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const mode = ref<'edit' | 'preview'>('preview')
const codeInputRef = ref<HTMLInputElement | null>()

const buttonVariants = cva({
  base: 'border py-1 text-c-2 rounded-md',
  variants: {
    active: {
      true: 'bg-b-2 bordber-c-2 text-c-1',
      false: 'border-transparent hover:bg-b-2 hover:text-c-1',
    },
  },
})

watch(mode, (newMode) => {
  if (newMode === 'edit') {
    codeInputRef.value?.focus()
  }
})
</script>

<template>
  <div
    class="border border-transparent hover:border-b-3 has-[:focus-visible]:bg-b-1 group flex flex-col relative rounded-lg overflow-hidden z-1">
    <!-- Tabs -->
    <div
      class="absolute bg-b-1 bottom-4 gap-1 hidden group-hover:grid grid-cols-2 left-1/2 p-1 text-sm rounded-lg -translate-x-1/2 z-[1]">
      <button
        class="px-3"
        :class="
          cx(
            buttonVariants({
              active: mode === 'preview',
            }),
          )
        "
        type="button"
        @click="mode = 'preview'">
        Preview
      </button>
      <button
        :class="cx(buttonVariants({ active: mode === 'edit' }))"
        type="button"
        @click="mode = 'edit'">
        Edit
      </button>
      <div
        class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
    </div>
    <div class="h-full overflow-y-auto">
      <!-- Preview -->
      <template v-if="mode === 'preview'">
        <ScalarMarkdown
          class="p-1.5"
          :value="modelValue"
          @dblclick="mode = 'edit'" />
      </template>
      <!-- Edit -->
      <template v-if="mode === 'edit'">
        <CodeInput
          ref="codeInputRef"
          class="h-full px-1 py-0 !rounded-lg"
          :class="{ 'min-h-[calc(1em*4)]': mode === 'edit' }"
          :modelValue="modelValue"
          @blur="mode = 'preview'"
          @update:modelValue="emit('update:value', $event)" />
      </template>
    </div>
    <div
      class="hidden group-hover:block brightness-lifted group-has-[:focus-visible]:hidden absolute inset-0 -z-1 rounded bg-b-1 shadow-lg" />
  </div>
</template>
<style scoped>
:deep(.cm-content) {
  min-height: fit-content;
}
</style>
