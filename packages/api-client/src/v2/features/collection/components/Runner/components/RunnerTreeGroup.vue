<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { cva } from '@scalar/use-hooks/useBindCx'
import { computed, ref } from 'vue'

const { title, selectedCount, totalCount } = defineProps<{
  title: string
  selectedCount: number
  totalCount: number
}>()

const isCollapsed = ref(false)

const hasSelection = computed(() => selectedCount > 0)
const isFullySelected = computed(
  () => selectedCount === totalCount && totalCount > 0,
)

type SelectionState = 'full' | 'partial' | 'none'

const selectionState = computed<SelectionState>(() => {
  if (isFullySelected.value) {
    return 'full'
  }
  if (hasSelection.value) {
    return 'partial'
  }
  return 'none'
})

const badgeVariants = cva({
  base: 'rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium tabular-nums transition-colors duration-100',
  variants: {
    selection: {
      full: 'bg-green/15 text-green',
      partial: 'bg-accent-color/15 text-accent-color',
      none: 'bg-b-3 text-c-3',
    },
  },
  defaultVariants: {
    selection: 'none',
  },
})

function toggle(): void {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <li
    class="border-border-color bg-b-1 flex flex-col rounded-lg border transition-colors duration-100">
    <!-- Header button -->
    <button
      :aria-expanded="!isCollapsed"
      class="group/toggle hover:bg-b-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors duration-100"
      type="button"
      @click="toggle">
      <!-- Caret -->
      <span
        class="text-c-3 flex size-4 items-center justify-center transition-transform duration-100"
        :class="!isCollapsed && 'rotate-90'">
        <ScalarIconCaretRight class="size-3" />
      </span>

      <!-- Title -->
      <span
        class="min-w-0 flex-1 truncate text-xs"
        :class="hasSelection ? 'text-c-1 font-medium' : 'text-c-2'">
        {{ title }}
      </span>

      <!-- Counter badge -->
      <span :class="badgeVariants({ selection: selectionState })">
        {{ selectedCount }}/{{ totalCount }}
      </span>
    </button>

    <!-- Children -->
    <ul
      v-show="!isCollapsed"
      class="border-border-color m-0 flex list-none flex-col gap-1.5 border-t p-0 px-2.5 pt-2 pb-2">
      <slot />
    </ul>
  </li>
</template>
