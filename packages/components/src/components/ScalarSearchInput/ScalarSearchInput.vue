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
import { ScalarIconMagnifyingGlass, ScalarIconX } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { ref } from 'vue'

import { ScalarIconButton } from '../ScalarIconButton'
import { type LoadingState, ScalarLoading } from '../ScalarLoading'

defineProps<{
  loader?: LoadingState
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
const { stylingAttrsCx, otherAttrs } = useBindCx()
</script>
<template>
  <label
    v-bind="
      stylingAttrsCx(
        'flex items-center text-lg font-medium h-10 pl-3 pr-1 py-2 gap-2.25',
      )
    ">
    <ScalarIconMagnifyingGlass class="text-sidebar-c-search size-4" />
    <input
      ref="inputRef"
      v-bind="otherAttrs"
      v-model="model"
      :aria-label="label ?? 'Enter search query'"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      class="flex-1 appearance-none rounded border-none bg-transparent outline-none"
      placeholder="Search..."
      spellcheck="false"
      type="search" />
    <ScalarLoading
      v-if="loader && loader.isActive"
      class="self-center"
      :loader
      size="md" />
    <ScalarIconButton
      v-else-if="model"
      class="p-0 size-5"
      :icon="ScalarIconX"
      label="Clear Search"
      weight="bold"
      @click.stop.prevent="handleClear" />
  </label>
</template>
