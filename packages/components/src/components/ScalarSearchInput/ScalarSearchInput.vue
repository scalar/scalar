<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import { cx } from '../../cva'

// import { type LoadingState, ScalarLoading } from '../ScalarLoading'

defineProps<{
  // loading?: LoadingState
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
  <input
    v-bind="attrs.rest"
    autocapitalize="off"
    autocomplete="off"
    autocorrect="off"
    class="ref-search-input"
    :class="
      cx(
        'rounded border p-3 text-sm font-medium outline-none focus:border-fore-1',
        attrs.className,
      )
    "
    placeholder="Search..."
    spellcheck="false"
    type="text"
    :value="modelValue"
    @input="handleInput" />
</template>
<style></style>
