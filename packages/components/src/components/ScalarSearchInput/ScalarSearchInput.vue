<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'

import { cva, cx } from '../../cva'
import { ScalarIcon } from '../ScalarIcon'
import { ScalarIconButton } from '../ScalarIconButton'
import { type LoadingState, ScalarLoading } from '../ScalarLoading'

defineProps<{
  loading?: LoadingState
  modelValue?: string
  sidebar?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function handleInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

defineOptions({ inheritAttrs: false })

/* Extract the classes so they can be merged by `cx` */
const attrs = computed(() => {
  const { class: className, ...rest } = useAttrs()
  return { className: className || '', rest }
})

const variants = cva({
  base: 'flex items-center rounded border bg-b-1 text-sm font-medium',
  variants: {
    sidebar: {
      true: 'h-8 gap-1.5 px-1.5 ',
      false: 'h-10 p-3',
    },
  },
})

defineExpose({
  focus: () => {
    inputRef.value?.focus()
  },
  blur: () => {
    inputRef.value?.blur()
  },
})
</script>
<template>
  <label
    v-bind="attrs.rest"
    :class="cx(variants({ sidebar }), attrs.className)">
    <span class="sr-only"><slot name="label">Enter search</slot></span>
    <ScalarIcon
      v-if="sidebar"
      class="text-c-2"
      icon="Search"
      size="xs"
      thickness="2.5" />
    <input
      ref="inputRef"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      class="flex-1 rounded border-none bg-transparent outline-none"
      placeholder="Search..."
      spellcheck="false"
      type="text"
      :value="modelValue"
      @input="handleInput" />
    <ScalarLoading
      v-if="loading && loading.isLoading"
      class="mr-3 self-center"
      :loadingState="loading"
      size="md" />
    <ScalarIconButton
      v-else-if="modelValue"
      :class="cx('p-0', sidebar ? 'h-4 w-4' : 'h-5 w-5')"
      icon="Close"
      label="Clear Search"
      :thickness="sidebar ? '1.75' : '1.5'"
      @click="emit('update:modelValue', '')" />
  </label>
</template>
