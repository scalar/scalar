<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import { cx } from '../../cva'
import { ScalarIconButton } from '../ScalarIconButton'
import { type LoadingState, ScalarLoading } from '../ScalarLoading'

defineProps<{
  loading?: LoadingState
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

function handleInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

defineOptions({ inheritAttrs: false })

/* Extract the classes so they can be merged by `cx` */
const attrs = computed(() => {
  const { class: className, ...rest } = useAttrs()
  return { className: className || '', rest }
})
</script>
<template>
  <label
    v-bind="attrs.rest"
    :class="
      cx(
        'flex rounded border bg-back-1 text-sm font-medium focus-within:border-fore-1',
        attrs.className,
      )
    ">
    <span class="sr-only"><slot name="label">Enter search</slot></span>
    <input
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      class="flex-1 rounded bg-transparent p-3 outline-none"
      placeholder="Search..."
      spellcheck="false"
      type="text"
      :value="modelValue"
      @input="handleInput" />
    <ScalarLoading
      v-if="loading && loading.isLoading"
      class="mr-3 self-center"
      :loadingState="loading"
      size="20px" />
    <ScalarIconButton
      v-else-if="modelValue"
      class="self-center"
      icon="Close"
      label="Clear Search"
      size="md"
      @click="emit('update:modelValue', '')" />
  </label>
</template>
