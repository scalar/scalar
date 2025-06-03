<script lang="ts">
/**
 * Scalar search input component
 *
 * Provides an large input field with a loading state and a clear button,
 * intended to be used with the ScalarSearchResults component.
 *
 * If you want a smaller input field for use in a sidebar, use
 * the ScalarSidebarSearchInput component instead.
 *
 * @example
 * <ScalarSearchInput v-model="search" />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { ref } from 'vue'

import { ScalarIconButton } from '../ScalarIconButton'
import { type LoadingState, ScalarLoading } from '../ScalarLoading'

defineProps<{
  loading?: LoadingState
  label?: string
}>()

const model = defineModel<string>()

const inputRef = ref<HTMLInputElement | null>(null)

function handleClear() {
  model.value = ''
  // Push focus back to the input
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

defineOptions({ inheritAttrs: false })
const { classCx, otherAttrs } = useBindCx()
</script>
<template>
  <label
    v-bind="
      classCx(
        'flex items-center rounded border text-sm font-medium has-[:focus-visible]:bg-b-1 bg-b-1.5 has-[:focus-visible]:outline h-10 p-3',
      )
    ">
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
      class="self-center"
      :loadingState="loading"
      size="md" />
    <ScalarIconButton
      v-else-if="model"
      class="p-0 size-5"
      icon="Close"
      label="Clear Search"
      thickness="1.5"
      @click.stop.prevent="handleClear" />
  </label>
</template>
