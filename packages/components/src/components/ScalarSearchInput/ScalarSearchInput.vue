<script setup lang="ts">
import { cva, cx } from '@scalar/use-hooks/useBindCx'
import { computed, ref, useAttrs } from 'vue'

import { ScalarIcon } from '../ScalarIcon'
import { ScalarIconButton } from '../ScalarIconButton'
import { type LoadingState, ScalarLoading } from '../ScalarLoading'

defineProps<{
  loading?: LoadingState
  modelValue?: string
  sidebar?: boolean
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function handleInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function handleClear() {
  emit('update:modelValue', '')
  // Push focus back to the input
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

defineOptions({ inheritAttrs: false })

/* Extract the classes so they can be merged by `cx` */
const attrs = computed(() => {
  const { class: className, ...rest } = useAttrs()
  return { class: className || '', rest }
})

const variants = cva({
  base: 'search-background flex items-center rounded border text-sm font-medium has-[:focus-visible]:bg-b-1 has-[:focus-visible]:outline',
  variants: {
    sidebar: {
      true: 'h-8 gap-2 px-1.5',
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
  <label :class="cx(variants({ sidebar }), attrs.class)">
    <ScalarIcon
      v-if="sidebar"
      class="text-c-2"
      icon="Search"
      size="xs"
      thickness="2.5" />
    <input
      ref="inputRef"
      v-bind="attrs.rest"
      :aria-label="label ?? 'Enter search query'"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      class="flex-1 appearance-none rounded border-none bg-transparent outline-none"
      placeholder="Search..."
      spellcheck="false"
      type="search"
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
      @click.stop.prevent="handleClear" />
  </label>
</template>
<style scoped>
.search-background {
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
}
.search-background:focus-within {
  background: transparent;
}
</style>
