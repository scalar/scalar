<script setup lang="ts">
import { ScalarIconMagnifyingGlass, ScalarIconX } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { ref } from 'vue'

import { ScalarIconButton } from '../ScalarIconButton'
import { type LoadingState, ScalarLoading } from '../ScalarLoading'

defineProps<{
  loading?: LoadingState
  label?: string
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const model = defineModel<string>()

function handleClear() {
  model.value = ''
  // Push focus back to the input
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

defineOptions({ inheritAttrs: false })
const { classCx, otherAttrs } = useBindCx()

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
})
</script>
<template>
  <label
    v-bind="
      classCx(
        'flex items-center rounded border text-sm font-medium has-[:focus-visible]:bg-b-1 has-[:focus-visible]:outline h-8 gap-2 px-1.5',
        'bg-sidebar-b-search border-sidebar-border-search',
        model ? 'text-c-1' : 'text-sidebar-c-search',
      )
    ">
    <ScalarIconMagnifyingGlass
      class="text-c-2 size-3"
      weight="bold" />
    <input
      ref="inputRef"
      :aria-label="label ?? 'Enter search query'"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      class="flex-1 appearance-none rounded border-none bg-transparent outline-none"
      placeholder="Search..."
      spellcheck="false"
      type="search"
      v-bind="otherAttrs"
      v-model="model" />
    <ScalarLoading
      v-if="loading && loading.isLoading"
      class="mr-3 self-center"
      :loadingState="loading"
      size="md" />
    <ScalarIconButton
      v-else-if="model"
      class="p-0.25 size-4"
      :icon="ScalarIconX"
      label="Clear Search"
      @click.stop.prevent="handleClear" />
  </label>
</template>
